const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transactions');
const LedgerEntry = require('../models/LedgerEntry');
const User = require('../models/User');
const { getIO } = require('../config/socket');

const MAX_PAGE_SIZE = 100;
const money = (value) => Math.round(Number(value) * 100) / 100;

const transactionFilterFor = async (userId, query) => {
  const filter = { $or: [{ senderId: userId }, { receiverId: userId }] };
  if (query.status) filter.status = query.status;
  if (query.type === 'sent') filter.senderId = userId;
  if (query.type === 'received') filter.receiverId = userId;
  if (query.minAmount || query.maxAmount) {
    filter.amount = {};
    if (query.minAmount) filter.amount.$gte = Number(query.minAmount);
    if (query.maxAmount) filter.amount.$lte = Number(query.maxAmount);
  }
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(`${query.endDate}T23:59:59.999Z`);
  }
  if (query.search && query.search.trim()) {
    const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchingUsers = await User.find({ $or: [{ name: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }] }).select('_id').lean();
    const ids = matchingUsers.map((user) => user._id);
    filter.$and = [{ $or: [{ idempotencyKey: { $regex: escaped, $options: 'i' } }, { senderId: { $in: ids } }, { receiverId: { $in: ids } }] }];
  }
  return filter;
};

const transactionView = (transaction, viewerId) => {
  const value = transaction.toObject ? transaction.toObject() : transaction;
  const isSender = String(value.senderId?._id || value.senderId) === String(viewerId);
  return { ...value, direction: isSender ? 'sent' : 'received' };
};

const getMyWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id }).lean();
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    return res.status(200).json({ balance: wallet.balance, currency: wallet.currency, status: wallet.status });
  } catch {
    return res.status(500).json({ message: 'Unable to fetch wallet' });
  }
};

const lookupRecipient = async (req, res) => {
  const email = req.query.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Recipient email is required' });
  const recipient = await User.findOne({ email }).select('name email').lean();
  if (!recipient || String(recipient._id) === String(req.user._id)) {
    return res.status(404).json({ message: 'Recipient wallet is unavailable' });
  }
  const wallet = await Wallet.findOne({ userId: recipient._id, status: 'active' }).lean();
  if (!wallet) return res.status(404).json({ message: 'Recipient wallet is unavailable' });
  return res.json({ recipient: { name: recipient.name, email: recipient.email } });
};

const transferFunds = async (req, res) => {
  const receiverEmail = typeof req.body.receiverEmail === 'string' ? req.body.receiverEmail.trim().toLowerCase() : '';
  const idempotencyKey = req.get('Idempotency-Key') || req.body.idempotencyKey;
  const description = typeof req.body.description === 'string' && req.body.description.trim() ? req.body.description.trim() : 'Peer-to-peer transfer';
  const transferAmount = money(req.body.amount);

  if (!receiverEmail || !idempotencyKey || !Number.isFinite(transferAmount) || transferAmount <= 0) {
    return res.status(400).json({ message: 'Provide a recipient email, positive amount, and idempotency key' });
  }
  if (idempotencyKey.length > 128 || description.length > 280) {
    return res.status(400).json({ message: 'Transfer request contains an invalid reference or description' });
  }

  const existing = await Transaction.findOne({ idempotencyKey }).populate('senderId receiverId', 'name email');
  if (existing) {
    const isParticipant = String(existing.senderId?._id || existing.senderId) === String(req.user._id)
      || String(existing.receiverId?._id || existing.receiverId) === String(req.user._id);
    if (!isParticipant) return res.status(409).json({ message: 'Idempotency key is already in use' });
    return res.status(200).json({ message: 'Transfer already processed', transaction: transactionView(existing, req.user._id), idempotent: true });
  }

  const maxTransfer = Number(process.env.MAX_TRANSFER_AMOUNT);
  if (Number.isFinite(maxTransfer) && maxTransfer > 0 && transferAmount > maxTransfer) {
    return res.status(400).json({ message: 'Transfer exceeds the configured per-transfer limit' });
  }

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const receiver = await User.findOne({ email: receiverEmail }).session(session);
      if (!receiver) {
        const error = new Error('No OpusPay account is registered with that email');
        error.statusCode = 404;
        throw error;
      }
      if (String(receiver._id) === String(req.user._id)) {
        const error = new Error('You cannot send money to your own wallet');
        error.statusCode = 400;
        throw error;
      }

      const receiverWallet = await Wallet.findOne({ userId: receiver._id, status: 'active' }).session(session);
      if (!receiverWallet) {
        const error = new Error('Recipient wallet is unavailable');
        error.statusCode = 404;
        throw error;
      }

      const senderWallet = await Wallet.findOneAndUpdate(
        { userId: req.user._id, status: 'active', balance: { $gte: transferAmount } },
        { $inc: { balance: -transferAmount } },
        { returnDocument: 'after', session }
      );
      if (!senderWallet) {
        const error = new Error('Insufficient available balance or inactive wallet');
        error.statusCode = 400;
        throw error;
      }

      const updatedReceiverWallet = await Wallet.findByIdAndUpdate(
        receiverWallet._id,
        { $inc: { balance: transferAmount } },
        { returnDocument: 'after', session }
      );
      const [transaction] = await Transaction.create([{
        type: 'transfer', senderId: req.user._id, receiverId: receiver._id, amount: transferAmount,
        currency: senderWallet.currency, idempotencyKey, status: 'completed', description
      }], { session });

      await LedgerEntry.create([
        { transactionId: transaction._id, walletId: senderWallet._id, direction: 'debit', amount: transferAmount, currency: senderWallet.currency, description },
        { transactionId: transaction._id, walletId: updatedReceiverWallet._id, direction: 'credit', amount: transferAmount, currency: updatedReceiverWallet.currency, description }
      ], { session });
      result = { transaction, currentBalance: senderWallet.balance, receiver };
    });
  } catch (error) {
    if (error?.code === 11000) {
      const original = await Transaction.findOne({ idempotencyKey }).populate('senderId receiverId', 'name email');
      const isParticipant = original && (String(original.senderId?._id || original.senderId) === String(req.user._id)
        || String(original.receiverId?._id || original.receiverId) === String(req.user._id));
      if (isParticipant) return res.status(200).json({ message: 'Transfer already processed', transaction: transactionView(original, req.user._id), idempotent: true });
      return res.status(409).json({ message: 'Idempotency key is already in use' });
    }
    if (error?.code === 20 || /replica set|Transaction numbers/.test(error.message || '')) {
      return res.status(503).json({ message: 'Transfers require a MongoDB replica set deployment' });
    }
    return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Transfer could not be completed' });
  } finally {
    await session.endSession();
  }

  try {
    getIO().to(`user:${result.receiver._id}`).emit('payment_received', {
      amount: transferAmount, senderName: req.user.name, senderEmail: req.user.email,
      transactionId: result.transaction._id, timestamp: result.transaction.createdAt
    });
  } catch (_) {
    // A notification failure does not affect a committed transfer.
  }

  return res.status(201).json({ message: 'Transfer completed', transaction: transactionView(result.transaction, req.user._id), currentBalance: result.currentBalance });
};

const getTransactionHistory = async (req, res) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), MAX_PAGE_SIZE);
    const filter = await transactionFilterFor(req.user._id, req.query);
    const sortField = ['createdAt', 'amount'].includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
    const sort = { [sortField]: req.query.order === 'asc' ? 1 : -1, _id: -1 };
    const [transactions, totalTransactions] = await Promise.all([
      Transaction.find(filter).populate('senderId receiverId', 'name email').sort(sort).skip((page - 1) * limit).limit(limit),
      Transaction.countDocuments(filter)
    ]);
    return res.json({ success: true, count: transactions.length, page, limit, totalTransactions, totalPages: Math.max(Math.ceil(totalTransactions / limit), 1), transactions: transactions.map((item) => transactionView(item, req.user._id)) });
  } catch {
    return res.status(500).json({ message: 'Unable to fetch transaction history' });
  }
};

const getTransaction = async (req, res) => {
  const transaction = await Transaction.findOne({ _id: req.params.transactionId, $or: [{ senderId: req.user._id }, { receiverId: req.user._id }] }).populate('senderId receiverId', 'name email');
  if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
  return res.json({ transaction: transactionView(transaction, req.user._id) });
};

const exportTransactions = async (req, res) => {
  const transactions = await Transaction.find(await transactionFilterFor(req.user._id, req.query)).populate('senderId receiverId', 'name email').sort({ createdAt: -1 }).limit(MAX_PAGE_SIZE);
  const csv = ['reference,date,direction,counterparty,amount,currency,status,description', ...transactions.map((item) => {
    const tx = transactionView(item, req.user._id);
    const counterparty = tx.direction === 'sent' ? tx.receiverId : tx.senderId;
    return [tx.idempotencyKey, tx.createdAt.toISOString(), tx.direction, counterparty?.email || '', tx.amount, tx.currency, tx.status, `"${(tx.description || '').replace(/"/g, '""')}"`].join(',');
  })].join('\n');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="opuspay-statement.csv"' });
  return res.send(csv);
};

const getSummary = async (req, res) => {
  const days = req.query.period === 'week' ? 7 : 30;
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  const records = await Transaction.find({ status: 'completed', createdAt: { $gte: start }, $or: [{ senderId: req.user._id }, { receiverId: req.user._id }] }).select('senderId receiverId amount createdAt').lean();
  const summary = records.reduce((acc, tx) => {
    const outgoing = String(tx.senderId) === String(req.user._id);
    if (outgoing) acc.sent += tx.amount;
    else acc.received += tx.amount;
    const key = tx.createdAt.toISOString().slice(0, 10);
    acc.activity[key] = (acc.activity[key] || 0) + tx.amount;
    return acc;
  }, { sent: 0, received: 0, activity: {} });
  return res.json({ period: days, sent: money(summary.sent), received: money(summary.received), activity: Object.entries(summary.activity).map(([date, amount]) => ({ date, amount })) });
};

const addDemoFunds = async (req, res) => {
  if ((process.env.NODE_ENV || 'development') !== 'development') {
    return res.status(403).json({ message: 'Demo funding is available only in development' });
  }

  const idempotencyKey = req.get('Idempotency-Key');
  const amount = money(req.body.amount);
  const maximum = Number(process.env.DEMO_FUND_MAX_AMOUNT || 5000);
  if (!idempotencyKey || !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
    return res.status(400).json({ message: 'A valid idempotency key is required' });
  }
  if (!Number.isFinite(amount) || amount < 1 || amount > maximum) {
    return res.status(400).json({ message: `Enter a demo amount between ₹1 and ₹${maximum}` });
  }

  const existing = await Transaction.findOne({ idempotencyKey }).populate('receiverId', 'name email');
  if (existing) {
    if (String(existing.receiverId?._id || existing.receiverId) !== String(req.user._id)) {
      return res.status(409).json({ message: 'Idempotency key is already in use' });
    }
    return res.status(200).json({ message: 'Demo funds already added', transaction: transactionView(existing, req.user._id), idempotent: true });
  }

  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const wallet = await Wallet.findOneAndUpdate(
        { userId: req.user._id, status: 'active' },
        { $inc: { balance: amount } },
        { new: true, session }
      );
      if (!wallet) {
        const error = new Error('Wallet not found or inactive');
        error.statusCode = 404;
        throw error;
      }

      const [transaction] = await Transaction.create([{
        type: 'deposit', receiverId: req.user._id, amount, currency: wallet.currency,
        idempotencyKey, status: 'completed', description: 'Demo Credit'
      }], { session });
      await LedgerEntry.create([{
        transactionId: transaction._id, walletId: wallet._id, direction: 'credit',
        amount, currency: wallet.currency, description: 'Demo Credit'
      }], { session });
      result = { wallet, transaction };
    });
  } catch (error) {
    if (error?.code === 11000) {
      const original = await Transaction.findOne({ idempotencyKey }).populate('receiverId', 'name email');
      if (original && String(original.receiverId?._id || original.receiverId) === String(req.user._id)) {
        return res.status(200).json({ message: 'Demo funds already added', transaction: transactionView(original, req.user._id), idempotent: true });
      }
      return res.status(409).json({ message: 'Idempotency key is already in use' });
    }
    if (error?.code === 20 || /replica set|Transaction numbers/.test(error.message || '')) {
      return res.status(503).json({ message: 'Demo funding requires a MongoDB replica set deployment' });
    }
    return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Unable to add demo funds' });
  } finally {
    await session.endSession();
  }

  return res.status(201).json({ message: 'Demo funds added', currentBalance: result.wallet.balance, transaction: transactionView(result.transaction, req.user._id) });
};

module.exports = { getMyWallet, lookupRecipient, transferFunds, addDemoFunds, getTransactionHistory, getTransaction, exportTransactions, getSummary };




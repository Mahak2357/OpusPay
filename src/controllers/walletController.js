const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transactions');
const User = require('../models/User');
const { getIO } = require('../config/socket');

// @desc    Get current user's wallet details
// @route   GET /api/wallet/me
// @access  Private
const getMyWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user._id });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    return res.status(200).json({
      balance: wallet.balance,
      currency: wallet.currency,
      status: wallet.status
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching wallet', error: error.message });
  }
};

// @desc    Transfer funds with ACID transaction & concurrency checks
// @route   POST /api/wallet/transfer
// @access  Private
const transferFunds = async (req, res) => {
  const session = await mongoose.startSession(); 

  try {
    const { receiverEmail, amount, idempotencyKey, description } = req.body; 
    const senderId = req.user._id;

    if (!receiverEmail || !amount || !idempotencyKey) { 
      return res.status(400).json({ message: 'Please provide receiverEmail, amount, and idempotencyKey' });
    }

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) { 
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    // 1. Check for duplicate transaction (Idempotency)
    const existingTx = await Transaction.findOne({ idempotencyKey });
    if (existingTx) {
      return res.status(409).json({
        message: 'Duplicate transaction detected. Request already processed.',
        transaction: existingTx
      });
    }

    // 2. Find receiver
    const receiver = await User.findOne({ email: receiverEmail.toLowerCase().trim() }); 
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver user not found' });
    }

    if (receiver._id.toString() === senderId.toString()) {
      return res.status(400).json({ message: 'Cannot transfer funds to your own account' });
    }

    // 3. Start ACID transaction session
    session.startTransaction(); // Start a new transaction session to ensure atomicity of the operations that follow.

    // 4. Atomic debit from sender with balance constraint to avoid race conditions
    const updatedSenderWallet = await Wallet.findOneAndUpdate(
      { userId: senderId, balance: { $gte: transferAmount }, status: 'active' },
      { $inc: { balance: -transferAmount } },
      { session, new: true }
    );

    if (!updatedSenderWallet) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance or wallet is frozen' });
    }

    // 5. Atomic credit to receiver
    const updatedReceiverWallet = await Wallet.findOneAndUpdate(
      { userId: receiver._id, status: 'active' },
      { $inc: { balance: transferAmount } },
      { session, new: true }
    );

    if (!updatedReceiverWallet) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Receiver wallet not found or inactive' });
    }

    // 6. Record transaction
    const newTransaction = await Transaction.create(
      [
        {
          type: 'transfer',
          senderId,
          receiverId: receiver._id,
          amount: transferAmount,
          idempotencyKey,
          status: 'completed',
          description: description || 'Peer-to-peer transfer'
        }
      ],
      { session }
    );

    // Commit all atomic operations
    await session.commitTransaction();

    // Emit real-time notification to receiver
try {
  const io = getIO();
  io.to(`user:${receiver._id.toString()}`).emit('payment_received', {
    amount: transferAmount,
    senderName: req.user.name,
    senderEmail: req.user.email,
    transactionId: newTransaction[0]._id,
    timestamp: newTransaction[0].createdAt
  });
} catch (socketErr) {
  console.error('Socket notification error:', socketErr.message);
}

    return res.status(200).json({
      message: 'Transfer successful',
      transaction: newTransaction[0],
      currentBalance: updatedSenderWallet.balance
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: 'Transaction failed and rolled back', error: error.message });
  } finally {
    session.endSession();
  }
};

// @desc    Get user transaction history with pagination
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Fetch transactions where user is either sender or receiver
    const filter = {
      $or: [{ senderId: userId }, { receiverId: userId }]
    };

    const transactions = await Transaction.find(filter)
      .populate('senderId', 'name email')
      .populate('receiverId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTransactions = await Transaction.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      page,
      totalPages: Math.ceil(totalTransactions / limit),
      transactions
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch transaction history',
      error: error.message
    });
  }
};

module.exports = {
  getMyWallet,
  transferFunds,
  getTransactionHistory
};
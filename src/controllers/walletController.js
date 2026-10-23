const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

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
    session.startTransaction();

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

module.exports = {
  getMyWallet,
  transferFunds
};
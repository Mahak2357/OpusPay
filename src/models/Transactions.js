const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['transfer', 'deposit', 'withdrawal'],
      default: 'transfer',
      required: true
    }, 
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.type === 'transfer' || this.type === 'withdrawal';
      }
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: function () {
        return this.type === 'transfer' || this.type === 'deposit';
      }
    },
    amount: {
      type: Number,
      required: [true, 'Transaction amount is required'],
      min: [1, 'Transaction amount must be at least 1']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'reversed'],
      default: 'pending'
    },
    externalDetails: {
      bankAccountNumber: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
      paymentGatewayTxnId: { type: String, trim: true }
    }, 
    idempotencyKey: {
      type: String,
      required: true,
      unique: true // Ensures that the same transaction cannot be processed multiple times
    },
    description: {
      type: String,
      trim: true,
      default: 'Wallet transactions' // Default description for transactions
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields to the schema
  }
);

// this is to optimize queries that filter transactions by senderId and sort them by creation date in descending order. This is useful for quickly retrieving a user's transaction history.
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1, createdAt: -1 });
transactionSchema.index({ idempotencyKey: 1 });// This index ensures that the idempotencyKey is unique and allows for fast lookups to prevent duplicate transactions.

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
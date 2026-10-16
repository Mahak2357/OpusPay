const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
    idempotencyKey: {
      type: String,
      required: true,
      unique: true // Ek idempotency key sirf ek hi baar process ho sakti hai
    },
    description: {
      type: String,
      trim: true,
      default: 'Peer-to-peer transfer'
    }
  },
  {
    timestamps: true
  }
);

// Compound Index: Ek user ke sent ya received transactions fast fetch karne ke liye
transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ receiverId: 1, createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
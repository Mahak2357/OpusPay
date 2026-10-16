const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    balance: {
      type: Number,
      required: true,
      default: 1000,
      min: [0, 'Wallet balance cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    status: {
      type: String,
      enum: ['active', 'frozen'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
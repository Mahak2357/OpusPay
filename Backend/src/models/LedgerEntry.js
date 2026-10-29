const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
      index: true
    },
    direction: {
      type: String,
      enum: ['debit', 'credit'],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01
    },
    currency: {
      type: String,
      required: true,
      uppercase: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: 280
    }
  },
  { timestamps: true }
);

ledgerEntrySchema.index({ transactionId: 1, direction: 1 }, { unique: true });
ledgerEntrySchema.index({ walletId: 1, createdAt: -1 });

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);

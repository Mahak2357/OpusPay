const test = require('node:test');
const assert = require('node:assert/strict');
const Wallet = require('../src/models/Wallet');
const Transaction = require('../src/models/Transactions');
const LedgerEntry = require('../src/models/LedgerEntry');
const mongoose = require('mongoose');

test('new wallets start with a zero balance', () => {
  const wallet = new Wallet({ userId: new mongoose.Types.ObjectId() });
  assert.equal(wallet.balance, 0);
  assert.equal(wallet.currency, 'INR');
  assert.equal(wallet.status, 'active');
});

test('transfer transaction requires an idempotency key', async () => {
  const transaction = new Transaction({
    senderId: new mongoose.Types.ObjectId(),
    receiverId: new mongoose.Types.ObjectId(),
    amount: 10
  });
  await assert.rejects(transaction.validate(), /idempotencyKey/);
});

test('ledger directions form debit and credit entries for a transfer', () => {
  const transactionId = new mongoose.Types.ObjectId();
  const debit = new LedgerEntry({ transactionId, walletId: new mongoose.Types.ObjectId(), direction: 'debit', amount: 25, currency: 'INR' });
  const credit = new LedgerEntry({ transactionId, walletId: new mongoose.Types.ObjectId(), direction: 'credit', amount: 25, currency: 'INR' });
  assert.equal(debit.amount, credit.amount);
  assert.notEqual(debit.direction, credit.direction);
});

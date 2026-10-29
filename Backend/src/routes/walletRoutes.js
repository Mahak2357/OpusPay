const express = require('express');
const router = express.Router();
const { getMyWallet, lookupRecipient, transferFunds, addDemoFunds, getTransactionHistory, getTransaction, exportTransactions, getSummary } = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');
const { rateLimit } = require('../middlewares/rateLimitMiddleware');

router.use(protect);
router.get('/me', getMyWallet);
router.get('/recipient', lookupRecipient);
router.post('/transfer', rateLimit({ windowMs: 60 * 1000, max: 10 }), transferFunds);
router.post('/demo-funds', rateLimit({ windowMs: 60 * 1000, max: 5 }), addDemoFunds);
router.get('/summary', getSummary);
router.get('/transactions/export.csv', exportTransactions);
router.get('/transactions/:transactionId', getTransaction);
router.get('/transactions', getTransactionHistory);

module.exports = router;


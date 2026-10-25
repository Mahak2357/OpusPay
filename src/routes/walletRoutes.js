const express = require('express');
const router = express.Router();
const { getMyWallet, transferFunds, getTransactionHistory } = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/me', protect, getMyWallet);
router.post('/transfer', protect, transferFunds);
router.get('/transactions', protect, getTransactionHistory);

module.exports = router;
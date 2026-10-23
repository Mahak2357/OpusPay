const express = require('express');
const router = express.Router();
const { getMyWallet, transferFunds } = require('../controllers/walletController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/me', protect, getMyWallet);
router.post('/transfer', protect, transferFunds);

module.exports = router;
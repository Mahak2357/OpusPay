const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check header me Authorization: Bearer <token> hai ya nahi
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // "Bearer <token>" se string split karke sirf token nikalna
      token = req.headers.authorization.split(' ')[1];

      // 2. Token ko verify karna secret key se
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // 3. Decoded token se userId lekar database se user fetch karna
      // .select('-password') ensure karta hai ki password req.user me na aaye
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User belonging to this token no longer exists' });
      }

      // Sab sahi hai, aage agle controller/function par jao
      next();
    } catch (error) {
      // Agar token expire ho gaya ho ya signature tamper hua ho
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
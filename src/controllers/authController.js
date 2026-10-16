const User = require('../models/User');
const Wallet = require('../models/Wallet');
const generateTokens = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');

// @desc    Register a new user & auto-create wallet
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // 2. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // 3. Create User (password hashing is saved by pre-hooks)
    const user = await User.create({
      name,
      email,
      password
    });

    // 4. Create linked wallet for this new user
    const wallet = await Wallet.create({
      userId: user._id,
      balance: 1000 // Welcome bonus for new users
    });

    // 5. Generate Access Token & set Refresh Token in cookie
    const accessToken = generateTokens(res, user._id);

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      wallet: {
        id: wallet._id,
        balance: wallet.balance,
        currency: wallet.currency
      },
      accessToken
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email and include password field for comparison (since it's select: false by default)
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // User ka wallet details fetch karna
    const wallet = await Wallet.findOne({ userId: user._id });

    // Generate tokens
    const accessToken = generateTokens(res, user._id);

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      wallet: wallet ? {
        id: wallet._id,
        balance: wallet.balance,
        currency: wallet.currency
      } : null,
      accessToken
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Clear refresh token & logout
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Silent Refresh: Naya Access Token mangna jab purana expire ho jaye
// @route   POST /api/auth/refresh
// @access  Public (Cookie verified)
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Refresh token verify karna
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
      }

      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Naya Access Token issue karna
      const newAccessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      );

      return res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error refreshing token', error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
};
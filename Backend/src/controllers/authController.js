const User = require('../models/User');
const Wallet = require('../models/Wallet');
const { clearAuthCookies, generateTokens, setAccessToken } = require('../utils/generateTokens');
const jwt = require('jsonwebtoken');

const userPayload = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });

const registerUser = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please provide all required fields' });
    if (name.length < 2 || name.length > 80 || password.length < 6) {
      return res.status(400).json({ message: 'Enter a valid name and a password of at least 6 characters' });
    }
    if (await User.exists({ email })) return res.status(409).json({ message: 'User with this email already exists' });

    const user = await User.create({ name, email, password });
    let wallet;
    try {
      wallet = await Wallet.create({ userId: user._id, balance: 0 });
    } catch (error) {
      await User.findByIdAndDelete(user._id);
      throw error;
    }
    generateTokens(res, user._id);
    return res.status(201).json({ message: 'User registered successfully', user: userPayload(user), wallet: { id: wallet._id, balance: wallet.balance, currency: wallet.currency } });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'User with this email already exists' });
    return res.status(500).json({ message: 'Unable to register right now' });
  }
};

const loginUser = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid email or password' });
    const wallet = await Wallet.findOne({ userId: user._id });
    generateTokens(res, user._id);
    return res.status(200).json({ message: 'Login successful', user: userPayload(user), wallet: wallet ? { id: wallet._id, balance: wallet.balance, currency: wallet.currency } : null });
  } catch {
    return res.status(500).json({ message: 'Unable to log in right now' });
  }
};

const logoutUser = (_req, res) => {
  clearAuthCookies(res);
  return res.status(200).json({ message: 'Logged out successfully' });
};

const refreshAccessToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh session available' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId).select('_id');
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: 'Session is no longer valid' });
    }
    setAccessToken(res, user._id);
    return res.status(204).send();
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({ message: 'Session expired' });
  }
};

const getProfile = async (req, res) => res.status(200).json({ user: { ...userPayload(req.user), createdAt: req.user.createdAt } });

const updateProfile = async (req, res) => {
  const name = req.body.name?.trim();
  if (!name || name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Provide a name between 2 and 80 characters' });
  req.user.name = name;
  await req.user.save();
  return res.status(200).json({ user: userPayload(req.user) });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Provide your current password and a new password of at least 8 characters' });
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) return res.status(401).json({ message: 'Current password is incorrect' });
  user.password = newPassword;
  await user.save();
  return res.status(200).json({ message: 'Password updated successfully' });
};

module.exports = { registerUser, loginUser, logoutUser, refreshAccessToken, getProfile, updateProfile, changePassword };

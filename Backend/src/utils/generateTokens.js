const jwt = require('jsonwebtoken');

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge
});

const setAccessToken = (res, userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
  res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
};

const generateTokens = (res, userId) => {
  setAccessToken(res, userId);
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
};

const clearAuthCookies = (res) => {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' };
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
};

module.exports = { generateTokens, setAccessToken, clearAuthCookies };

const jwt = require('jsonwebtoken');

const generateTokens = (res, userId) => {
  // 1. generate Access Token (15 minutes expiry)
  const accessToken = jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  // 2. generate Refresh Token (7 days expiry)
  const refreshToken = jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  // 3. to securely store the refresh token in an HTTP-only cookie, we set it in the response object. This prevents client-side JavaScript from accessing the token, mitigating XSS attacks. The cookie is also configured to be secure in production environments and has a strict same-site policy to prevent CSRF attacks. The maxAge is set to 7 days, aligning with the refresh token's expiry.
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true, // XSS attack protection (JS cannot access this)
    secure: process.env.NODE_ENV === 'production', // it means the cookie will only be sent over HTTPS in production, enhancing security
    sameSite: 'strict', // CSRF attack protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  });

  
  return accessToken;
};

module.exports = generateTokens;
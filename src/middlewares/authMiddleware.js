const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. check if the Authorization header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Extract the token from the header
      token = req.headers.authorization.split(' ')[1]; // The token is expected to be in the format "Bearer <token>", so we split the string by space and take the second part (the actual token).

      // 2. Verify the token using the secret key. If the token is valid, it will return the decoded payload (which contains the userId). If the token is invalid or expired, it will throw an error.
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      // 3. to ensure that the user associated with the token still exists in the database, we fetch the user by their ID (which we got from the decoded token). We also use .select('-password') to exclude the password field from the returned user object. This is a security measure to prevent sensitive information from being exposed.  
      // .select('-password') ensure karta hai ki password req.user me na aaye
      req.user = await User.findById(decoded.userId).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User belonging to this token no longer exists' });
      }

      // if everything is fine, move to the next middleware or route handler
      next();
    } catch (error) {
      // if there's an error during token verification (like if the token is invalid or expired), we catch that error and return a 401 Unauthorized response with a relevant message.   
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect }; 
// server/middleware/auth.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const auth = async (req, res, next) => {
  try {
    // Get token from header and remove 'Bearer ' prefix
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No authentication token provided');
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'No token provided'
      });
    }

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: 'Invalid token'
      });
    }

    // Find user and verify they exist
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found for token:', decoded.userId);
      return res.status(401).json({ 
        error: 'Authentication failed',
        details: 'User not found'
      });
    }
    
    // Attach user to request object
    req.user = user;
    req.token = token;
    next();
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
};

export default auth;

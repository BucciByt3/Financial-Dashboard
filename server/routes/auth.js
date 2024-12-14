// server/routes/auth.js
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { BlockedUser } from '../models/Admin.js';
import auth from '../middleware/auth.js';
import addLog from '../middleware/logging.js';

const router = express.Router();

const checkBlocked = async (req, res, next) => {
  try {
    const { email } = req.body;
    const deviceInfo = req.body.deviceInfo || {};
    const userAgent = req.headers['user-agent'];

    const blockedUser = await BlockedUser.findOne({ 
      $or: [
        { email },
        { userAgent },
        { 'deviceInfo.browser': deviceInfo.browser },
        { 'deviceInfo.networkDevices': { $in: deviceInfo.networkDevices || [] } }
      ]
    });

    if (blockedUser) {
      await addLog('warning', 'auth', 'Blocked user attempted access', { email });
      return res.status(403).json({
        error: 'Account creation not allowed',
        message: 'This device or email has been blocked by an administrator'
      });
    }

    next();
  } catch (error) {
    await addLog('error', 'auth', 'Check blocked error', { error: error.message });
    next(error);
  }
};

router.post('/register', checkBlocked, async (req, res) => {
  try {
    const { username, email, password, deviceInfo } = req.body;
    if (!username || !email || !password) {
      await addLog('warning', 'auth', 'Registration failed - missing fields');
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      await addLog('warning', 'auth', 'Registration failed - user exists', { username, email });
      return res.status(400).json({
        error: 'User already exists',
        field: existingUser.username === username ? 'username' : 'email'
      });
    }

    const user = new User({ username, email, password, deviceInfo });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await addLog('info', 'auth', 'New user registered', { userId: user._id, username });
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (error) {
    await addLog('error', 'auth', 'Registration error', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      await addLog('warning', 'auth', 'Login failed - invalid credentials', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const blockedUser = await BlockedUser.findOne({ email: user.email });
    if (blockedUser) {
      await addLog('warning', 'auth', 'Blocked user attempted login', { username });
      return res.status(403).json({
        error: 'Account blocked',
        message: 'This account has been blocked by an administrator'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await addLog('warning', 'auth', 'Login failed - wrong password', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    await addLog('info', 'auth', 'User logged in', { userId: user._id, username });
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });

  } catch (error) {
    await addLog('error', 'auth', 'Login error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/user', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    await addLog('error', 'auth', 'User fetch error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;

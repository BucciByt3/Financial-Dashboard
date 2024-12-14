// server/routes/admin.js
import express from 'express';
import { Admin, BlockedUser } from '../models/Admin.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import addLog from '../middleware/logging.js';
import Log from '../models/Log.js';

const router = express.Router();

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      await addLog('warning', 'admin', 'Authentication required - no token');
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      await addLog('warning', 'admin', 'Authentication failed - admin not found');
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    await addLog('error', 'admin', 'Authentication error', { error: error.message });
    res.status(401).json({ error: 'Authentication failed' });
  }
};

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin || !(await admin.comparePassword(password))) {
      await addLog('warning', 'admin', 'Invalid login attempt', { username });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { adminId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    await addLog('info', 'admin', 'Admin logged in', { adminId: admin._id });
    res.json({ 
      token, 
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    await addLog('error', 'admin', 'Login error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    await addLog('error', 'admin', 'Failed to fetch users', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await addLog('info', 'admin', 'User deleted', { userId: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    await addLog('error', 'admin', 'Failed to delete user', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.post('/block-user', adminAuth, async (req, res) => {
  try {
    const { email, reason, deviceInfo } = req.body;
    
    const existingBlock = await BlockedUser.findOne({ email });
    if (existingBlock) {
      await addLog('warning', 'admin', 'User already blocked', { email });
      return res.status(400).json({ error: 'User is already blocked' });
    }

    const blockedUser = new BlockedUser({
      email,
      reason,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceInfo: {
        ...deviceInfo,
        browser: deviceInfo.browser || req.headers['user-agent'],
        os: deviceInfo.os || 'Unknown',
      }
    });

    await blockedUser.save();
    await User.findOneAndDelete({ email });
    await addLog('info', 'admin', 'User blocked', { email, reason });

    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    await addLog('error', 'admin', 'Failed to block user', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/blocked-users', adminAuth, async (req, res) => {
  try {
    const blockedUsers = await BlockedUser.find();
    res.json(blockedUsers);
  } catch (error) {
    await addLog('error', 'admin', 'Failed to fetch blocked users', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/blocked-users/:id', adminAuth, async (req, res) => {
  try {
    await BlockedUser.findByIdAndDelete(req.params.id);
    await addLog('info', 'admin', 'User unblocked', { userId: req.params.id });
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    await addLog('error', 'admin', 'Failed to unblock user', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs', adminAuth, async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    
    let query = {};
    if (type) query.type = type;
    if (category) query.category = category;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await Log.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(req.query.limit) || 100);

    res.json(logs);
  } catch (error) {
    await addLog('error', 'admin', 'Failed to fetch logs', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;

// server/routes/accounts.js
import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all accounts for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.accounts || []);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new account
router.post('/', auth, async (req, res) => {
  try {
    const { name, type } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.accounts) {
      user.accounts = [];
    }
    
    user.accounts.push({
      name,
      type,
      balance: 0
    });
    
    await user.save();
    res.status(201).json(user.accounts);
  } catch (error) {
    console.error('Error creating account:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update an account
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, balance } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const account = user.accounts.id(req.params.id);
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (name) account.name = name;
    if (type) account.type = type;
    if (balance !== undefined) account.balance = balance;
    
    await user.save();
    res.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete an account
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const accountIndex = user.accounts.findIndex(acc => acc._id.toString() === req.params.id);
    if (accountIndex === -1) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    user.accounts.splice(accountIndex, 1);
    await user.save();
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

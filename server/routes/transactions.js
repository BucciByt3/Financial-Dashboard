// server/routes/transactions.js
import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all transactions
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.transactions || []);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new transaction
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received transaction data:', req.body);
    let transactionData = req.body;
    
    // If the data is an array, take the first item
    if (Array.isArray(transactionData)) {
      transactionData = transactionData[0];
    }

    const { type, amount, category, description, accountId, date } = transactionData;
    
    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find account using MongoDB's ObjectId comparison
    const account = user.accounts.find(acc => acc._id.toString() === accountId);
    if (!account) {
      console.error('Account not found:', {
        providedAccountId: accountId,
        availableAccounts: user.accounts.map(a => ({
          id: a._id.toString(),
          name: a.name
        }))
      });
      return res.status(404).json({ error: 'Account not found' });
    }

    // Parse amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create new transaction
    const newTransaction = {
      _id: new mongoose.Types.ObjectId(),
      type,
      amount: parsedAmount,
      category,
      description,
      accountId,
      date: date ? new Date(date) : new Date()
    };

    // Update account balance
    if (type === 'income') {
      account.balance += parsedAmount;
    } else if (type === 'expense') {
      account.balance -= parsedAmount;
    }

    // Round balance to 2 decimal places
    account.balance = Math.round(account.balance * 100) / 100;

    // Add transaction
    user.transactions.push(newTransaction);

    // Save changes
    await user.save();

    // Return only the new transaction
    res.status(201).json(newTransaction);

  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transaction = user.transactions.id(req.params.id);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update account balance before removing transaction
    const account = user.accounts.find(acc => acc._id.toString() === transaction.accountId);
    if (account) {
      if (transaction.type === 'income') {
        account.balance -= transaction.amount;
      } else {
        account.balance += transaction.amount;
      }
      account.balance = Math.round(account.balance * 100) / 100;
    }

    // Remove transaction
    user.transactions.pull(req.params.id);
    await user.save();

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

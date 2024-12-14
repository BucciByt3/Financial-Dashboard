// server/routes/cards.js
import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Get all cards
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.cards || []);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add new card
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received card data:', req.body);
    const { accountId, type, number, expiry } = req.body;
    
    // Find user
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('User not found:', req.user._id);
      return res.status(404).json({ error: 'User not found' });
    }

    // Find account
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

    // Create new card
    const newCard = {
      accountId,
      type: type.toLowerCase(),
      number,
      expiry
    };

    // Add card
    if (!user.cards) {
      user.cards = [];
    }
    user.cards.push(newCard);

    // Save
    await user.save();

    // Return all cards
    res.status(201).json(user.cards);
  } catch (error) {
    console.error('Error adding card:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete card
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cardIndex = user.cards.findIndex(card => card._id.toString() === req.params.id);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }

    user.cards.splice(cardIndex, 1);
    await user.save();
    res.json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

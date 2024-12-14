// server/routes/logs.js
import express from 'express';
import Log from '../models/Log.js';

const router = express.Router();

router.get('/', async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
});

export default router;

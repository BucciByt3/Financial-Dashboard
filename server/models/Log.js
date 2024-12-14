// server/models/Log.js
import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['error', 'warning', 'info'],
    required: true
  },
  category: {
    type: String,
    enum: ['auth', 'admin', 'system', 'user'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Log', logSchema);

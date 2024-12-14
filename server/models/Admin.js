// server/models/Admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const blockedUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  reason: String,
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    browser: String,
    os: String,
    language: String,
    vendor: String,
    screenResolution: String,
    colorDepth: Number,
    timezone: String,
    networkDevices: [String]
  },
  blockedAt: {
    type: Date,
    default: Date.now
  }
});

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['super', 'regular'],
    default: 'regular'
  },
  lastLogin: Date
}, {
  timestamps: true
});

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
const BlockedUser = mongoose.model('BlockedUser', blockedUserSchema);

export { Admin, BlockedUser };

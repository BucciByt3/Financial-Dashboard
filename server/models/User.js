// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Account Schema
const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Account name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Account type is required'],
    trim: true
  },
  balance: {
    type: Number,
    default: 0,
    get: v => parseFloat(v.toFixed(2)), // Round to 2 decimal places
    set: v => parseFloat(v.toFixed(2))
  }
});

// Card Schema
const cardSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Account ID is required'],
    ref: 'Account'
  },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: [true, 'Card type is required']
  },
  number: {
    type: String,
    required: [true, 'Card number is required'],
    validate: {
      validator: function(v) {
        return /^\d{4}-\d{4}-\d{4}-\d{4}$/.test(v);
      },
      message: props => `${props.value} is not a valid card number! Format should be: XXXX-XXXX-XXXX-XXXX`
    }
  },
  expiry: {
    type: String,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(v) {
        return /^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(v);
      },
      message: props => `${props.value} is not a valid expiry date! Format should be: MM/YY`
    }
  }
});

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Transaction type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    get: v => parseFloat(v.toFixed(2)),
    set: v => parseFloat(v.toFixed(2))
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Account ID is required'],
    ref: 'Account'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  accounts: [accountSchema],
  cards: [cardSchema],
  transactions: [transactionSchema]
}, { 
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Method to format monetary values
userSchema.methods.formatMoney = function(amount) {
  return parseFloat(amount.toFixed(2));
};

// Virtual for total balance
userSchema.virtual('totalBalance').get(function() {
  return this.accounts.reduce((total, account) => total + account.balance, 0);
});

const User = mongoose.model('User', userSchema);

export default User;

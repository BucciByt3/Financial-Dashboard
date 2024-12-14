// server/server.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import User from './models/User.js';

// Import all routes
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import accountsRoutes from './routes/accounts.js';
import cardsRoutes from './routes/cards.js';
import transactionsRoutes from './routes/transactions.js';
import logsRoutes from './routes/logs.js';

dotenv.config();

const app = express();
const serverIP = 'YOUR_IP_ADDRESS';

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  dbName: 'finance-dashboard',
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('\n--------------------');
  console.log('Connected to MongoDB successfully');
  console.log('Database: finance-dashboard');
  console.log('--------------------\n');
})
.catch((err) => {
  console.error('\n--------------------');
  console.error('MongoDB connection error:', err.message);
  console.error('Connection details:', {
    uri: process.env.MONGODB_URI?.replace(/:[^:/@]+@/, ':****@'),
    error: err.message
  });
  console.error('--------------------\n');
  process.exit(1);
});

// Request logging middleware
app.use((req, res, next) => {
  console.log('\n--------------------');
  console.log(`Zeitstempel: ${new Date().toISOString()}`);
  console.log(`Methode: ${req.method}`);
  console.log(`Pfad: ${req.path}`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  if (req.method !== 'GET') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  console.log('--------------------\n');
  next();
});

// Response logging middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    console.log('\n--------------------');
    console.log('Response:', JSON.stringify(body, null, 2));
    console.log('--------------------\n');
    return originalJson.call(this, body);
  };
  next();
});

// Basic route to check if server is running
app.get('/', (req, res) => {
  res.json({ 
    message: 'Finance Dashboard API is running',
    time: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Register all API routes
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/logs', logsRoutes);

// 404 handler
app.use((req, res) => {
  console.log(`404 - Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Not Found',
    message: `The requested resource ${req.originalUrl} was not found`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('\nError occurred:');
  console.error('Time:', new Date().toISOString());
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  console.error('--------------------\n');

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  // MongoDB duplicate key error
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate Entry',
      details: `${Object.keys(err.keyValue)[0]} already exists`
    });
  }

  // JWT authentication error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Authentication Error',
      details: 'Invalid token'
    });
  }

  // Default error response
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, 'YOUR_IP_ADDRESS ', () => {
  console.log('\n--------------------');
  console.log(`Server gestartet am ${new Date().toISOString()}`);
  console.log(`Server läuft auf http://${serverIP}:${PORT}`);
  console.log('API Routes:');
  console.log('- GET     /');
  console.log('- POST    /api/auth/register');
  console.log('- POST    /api/auth/login');
  console.log('- GET     /api/auth/user');
  console.log('- GET     /api/accounts');
  console.log('- POST    /api/accounts');
  console.log('- PUT     /api/accounts/:id');
  console.log('- DELETE  /api/accounts/:id');
  console.log('- GET     /api/cards');
  console.log('- POST    /api/cards');
  console.log('- PUT     /api/cards/:id');
  console.log('- DELETE  /api/cards/:id');
  console.log('- GET     /api/transactions');
  console.log('- POST    /api/transactions');
  console.log('- PUT     /api/transactions/:id');
  console.log('- DELETE  /api/transactions/:id');
  console.log('--------------------\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Handle uncaught errors
process.on('unhandledRejection', (err) => {
  console.error('\nUnhandled Promise Rejection:');
  console.error('Time:', new Date().toISOString());
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('--------------------\n');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode: Server continues running');
  } else {
    console.log('Development mode: Shutting down...');
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('\nUncaught Exception:');
  console.error('Time:', new Date().toISOString());
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('--------------------\n');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('Production mode: Attempting to gracefully shut down...');
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(1);
      });
    });
    
    // Force shutdown after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    console.log('Development mode: Shutting down immediately...');
    process.exit(1);
  }
});

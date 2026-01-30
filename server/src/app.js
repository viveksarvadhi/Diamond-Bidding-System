const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const { sequelize } = require('./config/database');
const { initializeWebSocket } = require('./websocket');
const auctionScheduler = require('./services/auctionScheduler');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const diamondRoutes = require('./routes/diamonds');
const bidRoutes = require('./routes/bids');
const userBidRoutes = require('./routes/userBids');
const resultRoutes = require('./routes/results');
const adminRoutes = require('./routes/admin');
const liveBidsRoutes = require('./routes/live-bids');
const schedulerRoutes = require('./routes/scheduler');
const endedAuctionsRoutes = require('./routes/endedAuctions');
const userResultsRoutes = require('./routes/userResults');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:60721',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Diamond Bidding System API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/diamonds', diamondRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/user-bids', userBidRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/live-bids', liveBidsRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/ended-auctions', endedAuctionsRoutes);
app.use('/api/user-results', userResultsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');

    // Sync database models (in development, use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized');
    }

    // Start HTTP server
    const server = http.createServer(app);
    
    // Initialize WebSocket
    initializeWebSocket(server);
    
    server.listen(PORT, () => {
      console.log(`🚀 Diamond Bidding System API running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      
      // Start the auction scheduler
      auctionScheduler.start();
      
      console.log(`🔄 WebSocket enabled for real-time bidding`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('� SIGTERM received, shutting down gracefully...');
  
  // Stop the auction scheduler
  auctionScheduler.stop();
  
  // Close database connection
  await sequelize.close();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('� SIGINT received, shutting down gracefully...');
  
  // Stop the auction scheduler
  auctionScheduler.stop();
  
  // Close database connection
  await sequelize.close();
  
  process.exit(0);
});

startServer();

module.exports = app;
const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const auctionScheduler = require('../services/auctionScheduler');

const router = express.Router();

// Get scheduler status
router.get('/status', authenticate, adminOnly, (req, res) => {
  try {
    const status = auctionScheduler.getStatus();
    res.json({
      success: true,
      data: {
        scheduler: status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get scheduler status',
      error: error.message
    });
  }
});

// Manually trigger expired auction check
router.post('/check-expired', authenticate, adminOnly, async (req, res) => {
  try {
    await auctionScheduler.checkExpiredAuctions();
    res.json({
      success: true,
      message: 'Expired auction check completed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check expired auctions',
      error: error.message
    });
  }
});

// Start scheduler
router.post('/start', authenticate, adminOnly, (req, res) => {
  try {
    auctionScheduler.start();
    res.json({
      success: true,
      message: 'Auction scheduler started',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start scheduler',
      error: error.message
    });
  }
});

// Stop scheduler
router.post('/stop', authenticate, adminOnly, (req, res) => {
  try {
    auctionScheduler.stop();
    res.json({
      success: true,
      message: 'Auction scheduler stopped',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to stop scheduler',
      error: error.message
    });
  }
});

module.exports = router;

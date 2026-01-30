const express = require('express');
const { UserBid, BidHistory, Bid, Diamond, User } = require('../models');
const { authenticate, adminOnly, userOnly } = require('../middleware/auth');
const Joi = require('joi');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const { getIO } = require('../websocket');

const router = express.Router();

// Validation schemas
const placeBidSchema = Joi.object({
  bidId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().precision(2).required()
});

const editBidSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required()
});

// Validation middleware
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    req[source] = value;
    next();
  };
};

// Get user's bids (authenticated users)
router.get('/my-bids', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    
    if (status) {
      whereClause['$bid.status$'] = status;
    }

    const { count, rows: userBids } = await UserBid.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'status', 'startTime', 'endTime', 'baseBidPrice'],
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice', 'image_url']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        userBids,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalBids: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get bid history for a specific user bid
router.get('/:id/history', authenticate, async (req, res, next) => {
  try {
    const userBidId = req.params.id;

    // Find user bid and verify ownership
    const userBid = await UserBid.findOne({
      where: { 
        id: userBidId,
        userId: req.user.id 
      },
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'status', 'startTime', 'endTime'],
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!userBid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found or access denied'
      });
    }

    // Get bid history
    const bidHistory = await BidHistory.findAll({
      where: { userBidId },
      order: [['updatedAt', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        userBid,
        bidHistory
      }
    });
  } catch (error) {
    next(error);
  }
});

// Place new bid
router.post('/', authenticate, userOnly, validate(placeBidSchema), async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { bidId, amount } = req.body;
    const userId = req.user.id;

    // Find and validate bid
    const bid = await Bid.findByPk(bidId, {
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice']
        }
      ]
    });

    if (!bid) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Check if bid is ACTIVE and result not declared (STEP 7: Prevent Changes After Result)
    if (bid.status !== 'ACTIVE' || bid.resultDeclared) {
      await transaction.rollback();
      let message = 'Cannot place bid';
      if (bid.resultDeclared) {
        message = 'Auction result has been declared - bidding closed permanently';
      } else {
        message = `Cannot place bid. Bid status is ${bid.status}`;
      }
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Check if bid time window is valid (STEP 2: Stop Bidding After End Time)
    const now = new Date();
    if (now < bid.startTime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Auction has not started yet'
      });
    }
    
    if (now >= bid.endTime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Auction has ended, bidding closed'
      });
    }

    // Check if amount meets minimum requirements
    if (amount < bid.baseBidPrice) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Bid amount must be at least $${bid.baseBidPrice}`
      });
    }

    // Check if user already has a bid for this bid
    const existingUserBid = await UserBid.findOne({
      where: { userId, bidId },
      transaction
    });

    if (existingUserBid) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already placed a bid for this auction. Use edit bid to update.'
      });
    }

    // Create new user bid
    const newUserBid = await UserBid.create({
      userId,
      bidId,
      amount
    }, { transaction });

    // Create initial bid history record
    await BidHistory.create({
      userBidId: newUserBid.id,
      oldAmount: null,
      newAmount: amount
    }, { transaction });

    await transaction.commit();

    // Fetch the created bid with associations
    const createdBid = await UserBid.findByPk(newUserBid.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'status', 'startTime', 'endTime'],
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice']
            }
          ]
        }
      ]
    });

    // Emit WebSocket event to admin room for real-time updates
    try {
      const io = getIO();
      const diamond = createdBid.bid?.diamond || bid.diamond;
      io.to('admin').emit('new-bid-activity', {
        userBidId: createdBid.id,
        userId: req.user.id,
        userName: req.user.name,
        bidId: bidId,
        diamondId: diamond?.id || bid.diamondId,
        diamondName: diamond?.name || 'Unknown Diamond',
        amount: parseFloat(amount),
        timestamp: new Date().toISOString(),
        updatedAt: createdBid.updatedAt,
        action: 'placed'
      });
    } catch (error) {
      console.error('Error emitting WebSocket event:', error);
      // Don't fail the request if WebSocket fails
    }

    res.status(201).json({
      success: true,
      message: 'Bid placed successfully',
      data: { userBid: createdBid }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

// Edit existing bid
router.put('/:id', authenticate, userOnly, validate(editBidSchema), async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { amount } = req.body;
    const userBidId = req.params.id;
    const userId = req.user.id;

    // Find user bid and verify ownership
    const userBid = await UserBid.findOne({
      where: { 
        id: userBidId,
        userId 
      },
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'status', 'startTime', 'endTime', 'baseBidPrice'],
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice']
            }
          ]
        }
      ],
      transaction
    });

    if (!userBid) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Bid not found or access denied'
      });
    }

    const bid = userBid.bid;

    // Check if bid is still ACTIVE and result not declared (STEP 7: Prevent Changes After Result)
    if (bid.status !== 'ACTIVE' || bid.resultDeclared) {
      await transaction.rollback();
      let message = 'Cannot edit bid';
      if (bid.resultDeclared) {
        message = 'Auction result has been declared - bidding closed permanently';
      } else {
        message = `Cannot edit bid. Bid status is ${bid.status}`;
      }
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Check if bid time window is still open
    const now = new Date();
    if (now >= bid.endTime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot edit bid after bidding has ended'
      });
    }

    // Check if amount meets minimum requirements
    if (amount < bid.baseBidPrice) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Bid amount must be at least $${bid.baseBidPrice}`
      });
    }

    // Check if amount is different from current
    if (amount === userBid.amount) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'New bid amount must be different from current amount'
      });
    }

    const oldAmount = userBid.amount;

    // Update user bid
    await userBid.update({ amount }, { transaction });

    // Create bid history record
    await BidHistory.create({
      userBidId: userBid.id,
      oldAmount,
      newAmount: amount
    }, { transaction });

    await transaction.commit();

    // Fetch updated bid with associations
    const updatedBid = await UserBid.findByPk(userBidId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'status', 'startTime', 'endTime'],
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice']
            }
          ]
        }
      ]
    });

    // Emit WebSocket event to admin room for real-time updates
    try {
      const io = getIO();
      const diamond = updatedBid.bid?.diamond || bid.diamond;
      io.to('admin').emit('new-bid-activity', {
        userBidId: updatedBid.id,
        userId: req.user.id,
        userName: req.user.name,
        bidId: updatedBid.bidId,
        diamondId: diamond?.id || bid.diamondId,
        diamondName: diamond?.name || 'Unknown Diamond',
        amount: parseFloat(amount),
        timestamp: new Date().toISOString(),
        updatedAt: updatedBid.updatedAt,
        action: 'updated'
      });
    } catch (error) {
      console.error('Error emitting WebSocket event:', error);
      // Don't fail the request if WebSocket fails
    }

    res.json({
      success: true,
      message: 'Bid updated successfully',
      data: { userBid: updatedBid }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

// Delete user bid (only allowed before bidding ends)
router.delete('/:id', authenticate, userOnly, async (req, res, next) => {
  try {
    const userBidId = req.params.id;
    const userId = req.user.id;

    // Find user bid and verify ownership
    const userBid = await UserBid.findOne({
      where: { 
        id: userBidId,
        userId 
      },
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'status', 'endTime']
        }
      ]
    });

    if (!userBid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found or access denied'
      });
    }

    // Check if bid is still ACTIVE and bidding hasn't ended
    const now = new Date();
    if (userBid.bid.status !== 'ACTIVE' || now >= userBid.bid.endTime) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete bid after bidding has ended'
      });
    }

    // Delete user bid (this will also delete bid history due to cascade)
    await userBid.destroy();

    res.json({
      success: true,
      message: 'Bid deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get highest bid for a specific bid (public access)
router.get('/bid/:bidId/highest', async (req, res, next) => {
  try {
    const bidId = req.params.bidId;

    // Find bid
    const bid = await Bid.findByPk(bidId, {
      attributes: ['id', 'status', 'endTime'],
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice']
        }
      ]
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Get highest bid
    const highestBid = await UserBid.findOne({
      where: { bidId },
      order: [['amount', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ]
    });

    // Get total bid count
    const totalBids = await UserBid.count({ where: { bidId } });

    res.json({
      success: true,
      data: {
        bid,
        highestBid,
        totalBids,
        isBiddingOpen: bid.status === 'ACTIVE' && new Date() < bid.endTime
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all bids for a specific bid (Admin only)
router.get('/bid/:bidId/all', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bidId = req.params.bidId;
    const { page = 1, limit = 50, sortBy = 'amount', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    // Find bid
    const bid = await Bid.findByPk(bidId, {
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice']
        }
      ]
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    const validSortFields = ['amount', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'amount';
    const order = [[sortField, sortOrder.toUpperCase()]];

    // Get all user bids for this bid
    const { count, rows: userBids } = await UserBid.findAndCountAll({
      where: { bidId },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: BidHistory,
          as: 'bidHistory',
          order: [['updatedAt', 'ASC']]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        bid,
        userBids,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalBids: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

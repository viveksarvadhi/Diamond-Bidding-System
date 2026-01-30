const express = require('express');
const { Bid, Diamond, UserBid, User, Result } = require('../models');
const { authenticate, adminOnly, optionalAuth } = require('../middleware/auth');
const Joi = require('joi');
const { Op } = require('sequelize');
const moment = require('moment');

const router = express.Router();

// Validation schemas
const createBidSchema = Joi.object({
  diamondId: Joi.number().integer().positive().required(),
  baseBidPrice: Joi.number().positive().precision(2).required(),
  startTime: Joi.date().iso().min(Date.now() - 5 * 60 * 1000).required(), // Allow up to 5 minutes ago for timezone sync
  endTime: Joi.date().iso().min(Joi.ref('startTime')).required()
});

const updateBidSchema = Joi.object({
  baseBidPrice: Joi.number().positive().precision(2),
  startTime: Joi.date().iso(),
  endTime: Joi.date().iso().min(Joi.ref('startTime'))
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

// Helper function to update bid status based on time
const updateBidStatus = async (bid) => {
  const now = new Date();
  let newStatus = bid.status;

  if (bid.status === 'DRAFT' && bid.startTime <= now && bid.endTime > now) {
    newStatus = 'ACTIVE';
  } else if (bid.status === 'ACTIVE' && bid.endTime <= now) {
    newStatus = 'CLOSED';
  }

  if (newStatus !== bid.status) {
    await bid.update({ status: newStatus });
  }

  return newStatus;
};

// Get all bids (Admin only)
router.get('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = '', 
      diamondId = '',
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (diamondId) {
      whereClause.diamondId = diamondId;
    }

    const validSortFields = ['createdAt', 'startTime', 'endTime', 'baseBidPrice', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = [[sortField, sortOrder.toUpperCase()]];

    const { count, rows: bids } = await Bid.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice']
        },
        {
          model: UserBid,
          as: 'userBids',
          attributes: ['id', 'amount', 'userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ],
          required: false
        },
        {
          model: Result,
          as: 'result',
          required: false
        }
      ]
    });

    // Update status for bids based on time
    for (const bid of bids) {
      await updateBidStatus(bid);
    }

    res.json({
      success: true,
      data: {
        bids,
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

// Get active bids (public access)
router.get('/active', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, diamondId = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {
      status: 'ACTIVE',
      startTime: { [Op.lte]: new Date() },
      endTime: { [Op.gt]: new Date() }
    };
    
    if (diamondId) {
      whereClause.diamondId = diamondId;
    }

    const { count, rows: bids } = await Bid.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['endTime', 'ASC']],
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice', 'description', 'image_url']
        },
        {
          model: UserBid,
          as: 'userBids',
          attributes: ['id', 'amount', 'createdAt'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name']
            }
          ],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        bids,
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

// Get bid by ID (Admin only)
router.get('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bid = await Bid.findByPk(req.params.id, {
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice', 'description', 'image_url']
        },
        {
          model: UserBid,
          as: 'userBids',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: Result,
          as: 'result',
          include: [
            {
              model: User,
              as: 'winner',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Update status based on time
    await updateBidStatus(bid);

    res.json({
      success: true,
      data: { bid }
    });
  } catch (error) {
    next(error);
  }
});

// Create new bid (Admin only)
router.post('/', authenticate, adminOnly, validate(createBidSchema), async (req, res, next) => {
  try {
    const { diamondId, baseBidPrice, startTime, endTime } = req.body;

    // Check if diamond exists
    const diamond = await Diamond.findByPk(diamondId);
    if (!diamond) {
      return res.status(404).json({
        success: false,
        message: 'Diamond not found'
      });
    }

    // Check if diamond already has active bid
    const activeBid = await Bid.findOne({
      where: { 
        diamondId,
        status: 'ACTIVE'
      }
    });

    if (activeBid) {
      return res.status(400).json({
        success: false,
        message: 'Diamond already has an active bid'
      });
    }

    // Check if there's any bid with overlapping time
    const overlappingBid = await Bid.findOne({
      where: {
        diamondId,
        [Op.or]: [
          {
            startTime: { [Op.between]: [startTime, endTime] }
          },
          {
            endTime: { [Op.between]: [startTime, endTime] }
          },
          {
            [Op.and]: [
              { startTime: { [Op.lte]: startTime } },
              { endTime: { [Op.gte]: endTime } }
            ]
          }
        ]
      }
    });

    if (overlappingBid) {
      return res.status(400).json({
        success: false,
        message: 'Bid time conflicts with existing bid for this diamond'
      });
    }

    // Create new bid
    const bid = await Bid.create({
      diamondId,
      baseBidPrice,
      startTime,
      endTime,
      status: new Date(startTime) <= new Date() ? 'ACTIVE' : 'DRAFT'
    });

    // Fetch the created bid with associations
    const createdBid = await Bid.findByPk(bid.id, {
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Bid created successfully',
      data: { bid: createdBid }
    });
  } catch (error) {
    next(error);
  }
});

// Update bid (Admin only - only DRAFT bids can be updated)
router.put('/:id', authenticate, adminOnly, validate(updateBidSchema), async (req, res, next) => {
  try {
    const { baseBidPrice, startTime, endTime } = req.body;
    const bidId = req.params.id;

    // Find bid
    const bid = await Bid.findByPk(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Only allow updating DRAFT bids
    if (bid.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT bids can be updated'
      });
    }

    // Check for time conflicts if updating time
    if (startTime || endTime) {
      const newStartTime = startTime || bid.startTime;
      const newEndTime = endTime || bid.endTime;

      const overlappingBid = await Bid.findOne({
        where: {
          diamondId: bid.diamondId,
          id: { [Op.ne]: bidId },
          [Op.or]: [
            {
              startTime: { [Op.between]: [newStartTime, newEndTime] }
            },
            {
              endTime: { [Op.between]: [newStartTime, newEndTime] }
            },
            {
              [Op.and]: [
                { startTime: { [Op.lte]: newStartTime } },
                { endTime: { [Op.gte]: newEndTime } }
              ]
            }
          ]
        }
      });

      if (overlappingBid) {
        return res.status(400).json({
          success: false,
          message: 'Updated time conflicts with existing bid for this diamond'
        });
      }
    }

    // Update bid
    await bid.update({ baseBidPrice, startTime, endTime });

    // Update status based on new time
    await updateBidStatus(bid);

    // Fetch updated bid with associations
    const updatedBid = await Bid.findByPk(bid.id, {
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Bid updated successfully',
      data: { bid: updatedBid }
    });
  } catch (error) {
    next(error);
  }
});

// Activate bid (Admin only - change DRAFT to ACTIVE)
router.patch('/:id/activate', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bidId = req.params.id;

    // Find bid
    const bid = await Bid.findByPk(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Only allow activating DRAFT bids
    if (bid.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT bids can be activated'
      });
    }

    // Check if start time is in the future or now
    if (bid.startTime > new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate bid before start time'
      });
    }

    // Check if end time is in the future
    if (bid.endTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot activate bid with end time in the past'
      });
    }

    // Activate bid
    await bid.update({ status: 'ACTIVE' });

    res.json({
      success: true,
      message: 'Bid activated successfully',
      data: { bid }
    });
  } catch (error) {
    next(error);
  }
});

// Delete bid (Admin only - only DRAFT bids can be deleted)
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bidId = req.params.id;

    // Find bid
    const bid = await Bid.findByPk(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Allow deleting DRAFT and ACTIVE bids (for cleanup purposes)
    if (bid.status !== 'DRAFT' && bid.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'Only DRAFT and ACTIVE bids can be deleted'
      });
    }

    // Delete bid
    await bid.destroy();

    res.json({
      success: true,
      message: 'Bid deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get bid statistics (Admin only)
router.get('/:id/stats', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bidId = req.params.id;

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

    // Get user bid statistics
    const userBidStats = await UserBid.findAll({
      where: { bidId },
      attributes: [
        [UserBid.sequelize.fn('COUNT', UserBid.sequelize.col('UserBid.id')), 'totalBids'],
        [UserBid.sequelize.fn('SUM', UserBid.sequelize.col('UserBid.amount')), 'totalAmount'],
        [UserBid.sequelize.fn('AVG', UserBid.sequelize.col('UserBid.amount')), 'averageAmount'],
        [UserBid.sequelize.fn('MAX', UserBid.sequelize.col('UserBid.amount')), 'highestAmount'],
        [UserBid.sequelize.fn('MIN', UserBid.sequelize.col('UserBid.amount')), 'lowestAmount']
      ]
    });

    // Get top bids
    const topBids = await UserBid.findAll({
      where: { bidId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['amount', 'DESC']],
      limit: 10
    });

    const stats = userBidStats[0];

    res.json({
      success: true,
      data: {
        bid,
        userBidStats: stats ? {
          totalBids: parseInt(stats.dataValues.totalBids) || 0,
          totalAmount: parseFloat(stats.dataValues.totalAmount) || 0,
          averageAmount: parseFloat(stats.dataValues.averageAmount) || 0,
          highestAmount: parseFloat(stats.dataValues.highestAmount) || 0,
          lowestAmount: parseFloat(stats.dataValues.lowestAmount) || 0
        } : {
          totalBids: 0,
          totalAmount: 0,
          averageAmount: 0,
          highestAmount: 0,
          lowestAmount: 0
        },
        topBids
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

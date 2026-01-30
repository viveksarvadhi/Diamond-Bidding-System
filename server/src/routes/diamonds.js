const express = require('express');
const { Diamond, Bid, UserBid } = require('../models');
const { authenticate, adminOnly, optionalAuth } = require('../middleware/auth');
const Joi = require('joi');
const { Op } = require('sequelize');

const router = express.Router();

// Validation schemas
const createDiamondSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  basePrice: Joi.number().positive().precision(2).required(),
  description: Joi.string().max(2000).optional(),
  image_url: Joi.string().uri().optional()
});

const updateDiamondSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  basePrice: Joi.number().positive().precision(2),
  description: Joi.string().max(2000),
  image_url: Joi.string().uri()
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

// Get all diamonds (public access)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const validSortFields = ['name', 'basePrice', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = [[sortField, sortOrder.toUpperCase()]];

    const { count, rows: diamonds } = await Diamond.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order,
      include: [
        {
          model: Bid,
          as: 'bids',
          attributes: ['id', 'status', 'startTime', 'endTime'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      data: {
        diamonds,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalDiamonds: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get diamond by ID (public access)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const diamond = await Diamond.findByPk(req.params.id, {
      include: [
        {
          model: Bid,
          as: 'bids',
          attributes: ['id', 'status', 'startTime', 'endTime', 'baseBidPrice'],
          include: [
            {
              model: UserBid,
              as: 'userBids',
              attributes: ['id', 'amount', 'createdAt'],
              include: [
                {
                  model: UserBid.sequelize.models.User,
                  as: 'user',
                  attributes: ['id', 'name']
                }
              ],
              required: false
            }
          ],
          required: false
        }
      ]
    });

    if (!diamond) {
      return res.status(404).json({
        success: false,
        message: 'Diamond not found'
      });
    }

    res.json({
      success: true,
      data: { diamond }
    });
  } catch (error) {
    next(error);
  }
});

// Create new diamond (Admin only)
router.post('/', authenticate, adminOnly, validate(createDiamondSchema), async (req, res, next) => {
  try {
    const { name, basePrice, description, image_url } = req.body;

    // Check if diamond name already exists
    const existingDiamond = await Diamond.findOne({ where: { name } });
    if (existingDiamond) {
      return res.status(400).json({
        success: false,
        message: 'Diamond with this name already exists'
      });
    }

    // Create new diamond
    const diamond = await Diamond.create({
      name,
      basePrice,
      description,
      image_url
    });

    res.status(201).json({
      success: true,
      message: 'Diamond created successfully',
      data: { diamond }
    });
  } catch (error) {
    next(error);
  }
});

// Update diamond (Admin only)
router.put('/:id', authenticate, adminOnly, validate(updateDiamondSchema), async (req, res, next) => {
  try {
    const { name, basePrice, description, image_url } = req.body;
    const diamondId = req.params.id;

    // Find diamond
    const diamond = await Diamond.findByPk(diamondId);
    if (!diamond) {
      return res.status(404).json({
        success: false,
        message: 'Diamond not found'
      });
    }

    // Check if diamond has active bids
    const activeBid = await Bid.findOne({
      where: { 
        diamondId,
        status: 'ACTIVE'
      }
    });

    if (activeBid) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update diamond with active bids'
      });
    }

    // Check if name is being changed and if it already exists
    if (name && name !== diamond.name) {
      const existingDiamond = await Diamond.findOne({ 
        where: { name },
        exclude: [{ where: { id: diamondId } }]
      });
      
      if (existingDiamond) {
        return res.status(400).json({
          success: false,
          message: 'Diamond with this name already exists'
        });
      }
    }

    // Update diamond
    await diamond.update({ name, basePrice, description, image_url });

    res.json({
      success: true,
      message: 'Diamond updated successfully',
      data: { diamond }
    });
  } catch (error) {
    next(error);
  }
});

// Delete diamond (Admin only)
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const diamondId = req.params.id;

    // Find diamond
    const diamond = await Diamond.findByPk(diamondId);
    if (!diamond) {
      return res.status(404).json({
        success: false,
        message: 'Diamond not found'
      });
    }

    // Check if diamond has any bids
    const bidCount = await Bid.count({ where: { diamondId } });
    if (bidCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete diamond with existing bids'
      });
    }

    // Delete diamond
    await diamond.destroy();

    res.json({
      success: true,
      message: 'Diamond deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get diamond statistics (Admin only)
router.get('/:id/stats', authenticate, adminOnly, async (req, res, next) => {
  try {
    const diamondId = req.params.id;

    // Find diamond
    const diamond = await Diamond.findByPk(diamondId);
    if (!diamond) {
      return res.status(404).json({
        success: false,
        message: 'Diamond not found'
      });
    }

    // Get bid statistics
    const bidStats = await Bid.findAll({
      where: { diamondId },
      attributes: [
        'status',
        [Bid.sequelize.fn('COUNT', Bid.sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    // Get user bid statistics
    const userBidStats = await UserBid.findAll({
      where: {
        '$bid.diamondId$': diamondId
      },
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: []
        }
      ],
      attributes: [
        [UserBid.sequelize.fn('COUNT', UserBid.sequelize.col('UserBid.id')), 'totalBids'],
        [UserBid.sequelize.fn('SUM', UserBid.sequelize.col('UserBid.amount')), 'totalAmount'],
        [UserBid.sequelize.fn('AVG', UserBid.sequelize.col('UserBid.amount')), 'averageAmount'],
        [UserBid.sequelize.fn('MAX', UserBid.sequelize.col('UserBid.amount')), 'highestAmount']
      ]
    });

    const stats = userBidStats[0];

    res.json({
      success: true,
      data: {
        diamond,
        bidStatusStats: bidStats,
        userBidStats: stats ? {
          totalBids: parseInt(stats.dataValues.totalBids) || 0,
          totalAmount: parseFloat(stats.dataValues.totalAmount) || 0,
          averageAmount: parseFloat(stats.dataValues.averageAmount) || 0,
          highestAmount: parseFloat(stats.dataValues.highestAmount) || 0
        } : {
          totalBids: 0,
          totalAmount: 0,
          averageAmount: 0,
          highestAmount: 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

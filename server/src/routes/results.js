const express = require('express');
const { Result, Bid, UserBid, User, Diamond } = require('../models');
const { authenticate, adminOnly, optionalAuth } = require('../middleware/auth');
const Joi = require('joi');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const router = express.Router();

// Validation schemas
const declareResultSchema = Joi.object({
  bidId: Joi.number().integer().positive().required()
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

// Get all results (Admin only)
router.get('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, bidId = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    if (bidId) {
      whereClause.bidId = bidId;
    }

    const { count, rows: results } = await Result.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['declaredAt', 'DESC']],
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'startTime', 'endTime', 'baseBidPrice', 'status'],
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice', 'image_url']
            }
          ]
        },
        {
          model: User,
          as: 'winner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'declarer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalResults: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get results for current user (authenticated users)
router.get('/my-results', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { winnerUserId: req.user.id };
    
    if (status) {
      whereClause['$bid.status$'] = status;
    }

    const { count, rows: results } = await Result.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['declaredAt', 'DESC']],
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'startTime', 'endTime', 'baseBidPrice', 'status'],
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice', 'image_url']
            },
            {
              model: UserBid,
              as: 'userBids',
              where: { userId: req.user.id },
              attributes: ['id', 'amount', 'createdAt'],
              required: false
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      data: {
        results,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalResults: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get result by ID (public access)
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const resultId = req.params.id;

    const result = await Result.findByPk(resultId, {
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'startTime', 'endTime', 'baseBidPrice', 'status'],
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
              order: [['amount', 'DESC']],
              required: false
            }
          ]
        },
        {
          model: User,
          as: 'winner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'declarer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Add user's bid info if authenticated
    let userBidInfo = null;
    if (req.user) {
      const userBid = result.bid.userBids.find(ub => ub.userId === req.user.id);
      if (userBid) {
        userBidInfo = {
          amount: userBid.amount,
          createdAt: userBid.createdAt,
          isWinner: result.winnerUserId === req.user.id,
          rank: result.bid.userBids.findIndex(ub => ub.userId === req.user.id) + 1
        };
      }
    }

    res.json({
      success: true,
      data: {
        result,
        userBidInfo
      }
    });
  } catch (error) {
    next(error);
  }
});

// Declare result (Admin only)
router.post('/', authenticate, adminOnly, validate(declareResultSchema), async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { bidId } = req.body;
    const declaredBy = req.user.id;

    // Find bid
    const bid = await Bid.findByPk(bidId, {
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice']
        }
      ],
      transaction
    });

    if (!bid) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Check if bid is CLOSED (bidding has ended)
    if (bid.status !== 'CLOSED') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot declare result. Bidding has not ended yet.'
      });
    }

    // Check if result already exists
    const existingResult = await Result.findOne({
      where: { bidId },
      transaction
    });

    if (existingResult) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Result already declared for this bid'
      });
    }

    // Find highest bid
    const highestUserBid = await UserBid.findOne({
      where: { bidId },
      order: [['amount', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      transaction
    });

    if (!highestUserBid) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No bids placed for this auction. Cannot declare result.'
      });
    }

    // Create result
    const result = await Result.create({
      bidId,
      winnerUserId: highestUserBid.userId,
      winningAmount: highestUserBid.amount,
      declaredBy
    }, { transaction });

    // Update bid to mark result as declared
    await bid.update({ resultDeclared: true }, { transaction });

    await transaction.commit();

    // Fetch the created result with full associations
    const createdResult = await Result.findByPk(result.id, {
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id', 'startTime', 'endTime', 'baseBidPrice', 'status'],
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice']
            }
          ]
        },
        {
          model: User,
          as: 'winner',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'declarer',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Result declared successfully',
      data: { result: createdResult }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

// Get bid summary before declaring result (Admin only)
router.get('/bid/:bidId/summary', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bidId = req.params.bidId;

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

    // Check if result already exists
    const existingResult = await Result.findOne({ where: { bidId } });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Result already declared for this bid'
      });
    }

    // Get all user bids for this bid
    const userBids = await UserBid.findAll({
      where: { bidId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['amount', 'DESC']]
    });

    // Calculate statistics
    const totalBids = userBids.length;
    const totalAmount = userBids.reduce((sum, ub) => sum + parseFloat(ub.amount), 0);
    const averageAmount = totalBids > 0 ? totalAmount / totalBids : 0;
    const highestBid = userBids[0];
    const lowestBid = userBids[userBids.length - 1];

    // Check if bidding has ended
    const now = new Date();
    const hasBiddingEnded = bid.status === 'CLOSED' || now >= bid.endTime;

    res.json({
      success: true,
      data: {
        bid,
        summary: {
          totalBids,
          totalAmount,
          averageAmount,
          highestBid: highestBid ? {
            amount: highestBid.amount,
            user: highestBid.user
          } : null,
          lowestBid: lowestBid ? {
            amount: lowestBid.amount,
            user: lowestBid.user
          } : null
        },
        canDeclareResult: hasBiddingEnded && totalBids > 0,
        allBids: userBids
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get result statistics (Admin only)
router.get('/stats/overview', authenticate, adminOnly, async (req, res, next) => {
  try {
    // Get overall statistics
    const totalResults = await Result.count();
    const totalBids = await Bid.count();
    const closedBids = await Bid.count({ where: { status: 'CLOSED' } });
    const declaredResults = await Bid.count({ where: { resultDeclared: true } });

    // Get results by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyResults = await Result.findAll({
      where: {
        declaredAt: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('declaredAt')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('winningAmount')), 'totalAmount']
      ],
      group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('declaredAt'))],
      order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('declaredAt')), 'ASC']]
    });

    // Get top winning amounts
    const topResults = await Result.findAll({
      include: [
        {
          model: Bid,
          as: 'bid',
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: User,
          as: 'winner',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['winningAmount', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalResults,
          totalBids,
          closedBids,
          declaredResults,
          pendingDeclarations: closedBids - declaredResults
        },
        monthlyResults: monthlyResults.map(r => ({
          month: r.dataValues.month,
          count: parseInt(r.dataValues.count),
          totalAmount: parseFloat(r.dataValues.totalAmount) || 0
        })),
        topResults
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete result (Admin only - for emergency cases)
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  const transaction = await sequelize.transaction();
  
  try {
    const resultId = req.params.id;

    // Find result
    const result = await Result.findByPk(resultId, {
      include: [
        {
          model: Bid,
          as: 'bid',
          attributes: ['id']
        }
      ],
      transaction
    });

    if (!result) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Update bid to remove result declaration flag
    await result.bid.update({ resultDeclared: false }, { transaction });

    // Delete result
    await result.destroy({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

module.exports = router;

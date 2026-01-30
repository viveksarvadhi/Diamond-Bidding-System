const express = require('express');
const { Bid, Diamond, UserBid, User, Result } = require('../models');
const { authenticate, adminOnly } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// STEP 3: Admin Dashboard - View Ended Auctions
router.get('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Find auctions with status CLOSED (ended) but resultDeclared = false
    const endedAuctions = await Bid.findAndCountAll({
      where: {
        status: 'CLOSED',
        resultDeclared: false
      },
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice', 'image_url']
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
          ],
          order: [['amount', 'DESC']]
        }
      ],
      order: [['endTime', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(endedAuctions.count / limit);

    res.json({
      success: true,
      data: {
        auctions: endedAuctions.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalAuctions: endedAuctions.count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// STEP 4: Identify Highest Bid Automatically
router.get('/:auctionId/highest-bid', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { auctionId } = req.params;

    // Find auction with all bids
    const auction = await Bid.findOne({
      where: { id: auctionId },
      include: [
        {
          model: Diamond,
          as: 'diamond',
          attributes: ['id', 'name', 'basePrice', 'image_url']
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
          ],
          order: [['amount', 'DESC']] // Highest bid first
        }
      ]
    });

    if (!auction) {
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    // Get highest bid (first in ordered list)
    const highestBid = auction.userBids && auction.userBids.length > 0 
      ? auction.userBids[0] 
      : null;

    res.json({
      success: true,
      data: {
        auction,
        highestBid,
        hasBids: auction.userBids && auction.userBids.length > 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// STEP 5: Admin Declares Result
router.post('/:auctionId/declare-result', authenticate, adminOnly, async (req, res, next) => {
  const transaction = await require('../config/database').sequelize.transaction();
  
  try {
    const { auctionId } = req.params;
    const adminId = req.user.id;

    // Find auction with bids
    const auction = await Bid.findOne({
      where: { id: auctionId },
      include: [
        {
          model: UserBid,
          as: 'userBids',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ],
          order: [['amount', 'DESC']]
        }
      ],
      transaction
    });

    if (!auction) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Auction not found'
      });
    }

    if (auction.resultDeclared) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Result already declared for this auction'
      });
    }

    let winner = null;
    let winningAmount = 0;

    // Identify highest bid automatically
    if (auction.userBids && auction.userBids.length > 0) {
      const highestBid = auction.userBids[0]; // Already ordered by amount DESC
      winner = highestBid.user;
      winningAmount = highestBid.amount;

      // Create result record
      await Result.create({
        bidId: auction.id,
        winnerUserId: winner.id,
        winningAmount: winningAmount,
        declaredBy: adminId,
        declaredAt: new Date()
      }, { transaction });
    } else {
      // No bids were placed
      await Result.create({
        bidId: auction.id,
        winnerUserId: null,
        winningAmount: 0,
        declaredBy: adminId,
        declaredAt: new Date()
      }, { transaction });
    }

    // Update auction status to COMPLETED and resultDeclared to true
    await auction.update({
      status: 'CLOSED', // Keep as CLOSED since that's the enum
      resultDeclared: true
    }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Result declared successfully',
      data: {
        auctionId: auction.id,
        winner: winner ? {
          id: winner.id,
          name: winner.name,
          email: winner.email
        } : null,
        winningAmount,
        declaredBy: adminId,
        declaredAt: new Date()
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

module.exports = router;

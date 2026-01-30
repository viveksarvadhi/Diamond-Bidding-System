const express = require('express');
const { Bid, Diamond, UserBid, User, Result } = require('../models');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// STEP 6: Update User Status (Win / Lose)
// Get user's auction results with win/lose status
router.get('/my-results', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const userId = req.user.id;

    // Find all results where user participated
    const userBids = await UserBid.findAll({
      where: { userId },
      include: [
        {
          model: Bid,
          as: 'bid',
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice', 'image_url']
            },
            {
              model: Result,
              as: 'result',
              required: false // Include auctions without results
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Process each bid to determine win/lose status
    const processedResults = userBids.map(userBid => {
      const bid = userBid.bid;
      const result = bid.result;
      
      let status = 'pending'; // Default status
      let statusMessage = 'Auction in progress';
      let isWinner = false;

      if (result) {
        // Result has been declared
        if (result.winnerUserId === userId) {
          status = 'won';
          statusMessage = '✅ You Won';
          isWinner = true;
        } else if (result.winnerUserId === null) {
          status = 'no_winner';
          statusMessage = '❌ No winner - No bids were placed';
        } else {
          status = 'lost';
          statusMessage = '❌ You Lost';
        }
      } else if (bid.status === 'CLOSED' && !bid.resultDeclared) {
        // Auction ended but result not declared yet
        status = 'awaiting_result';
        statusMessage = '⏳ Awaiting result declaration';
      } else if (bid.status === 'ACTIVE') {
        // Auction still active
        const now = new Date();
        if (now >= bid.endTime) {
          status = 'ended';
          statusMessage = '⏰ Auction ended, result pending';
        } else {
          status = 'active';
          statusMessage = '🎯 Auction active';
        }
      }

      return {
        userBidId: userBid.id,
        bidAmount: userBid.amount,
        bidId: bid.id,
        auction: {
          id: bid.id,
          startTime: bid.startTime,
          endTime: bid.endTime,
          status: bid.status,
          resultDeclared: bid.resultDeclared,
          diamond: bid.diamond
        },
        result: result ? {
          id: result.id,
          winningAmount: result.winningAmount,
          declaredAt: result.declaredAt,
          declaredBy: result.declaredBy
        } : null,
        userStatus: {
          status,
          statusMessage,
          isWinner,
          participated: true
        }
      };
    });

    // Get total count for pagination
    const totalCount = await UserBid.count({
      where: { userId }
    });

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      data: {
        results: processedResults,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalResults: totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get specific auction result for user
router.get('/auction/:auctionId', authenticate, async (req, res, next) => {
  try {
    const { auctionId } = req.params;
    const userId = req.user.id;

    // Find user's bid in this auction
    const userBid = await UserBid.findOne({
      where: { 
        userId,
        bidId: auctionId
      },
      include: [
        {
          model: Bid,
          as: 'bid',
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice', 'image_url']
            },
            {
              model: Result,
              as: 'result',
              required: false,
              include: [
                {
                  model: User,
                  as: 'winner',
                  attributes: ['id', 'name', 'email']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!userBid) {
      return res.status(404).json({
        success: false,
        message: 'You did not participate in this auction'
      });
    }

    const bid = userBid.bid;
    const result = bid.result;
    
    let status = 'pending';
    let statusMessage = 'Auction in progress';
    let isWinner = false;

    if (result) {
      if (result.winnerUserId === userId) {
        status = 'won';
        statusMessage = '✅ You Won';
        isWinner = true;
      } else if (result.winnerUserId === null) {
        status = 'no_winner';
        statusMessage = '❌ No winner - No bids were placed';
      } else {
        status = 'lost';
        statusMessage = '❌ You Lost';
      }
    } else if (bid.status === 'CLOSED' && !bid.resultDeclared) {
      status = 'awaiting_result';
      statusMessage = '⏳ Awaiting result declaration';
    } else if (bid.status === 'ACTIVE') {
      const now = new Date();
      if (now >= bid.endTime) {
        status = 'ended';
        statusMessage = '⏰ Auction ended, result pending';
      } else {
        status = 'active';
        statusMessage = '🎯 Auction active';
      }
    }

    // Get all bids for this auction to show ranking
    const allBids = await UserBid.findAll({
      where: { bidId: auctionId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['amount', 'DESC']]
    });

    const userRank = allBids.findIndex(bid => bid.userId === userId) + 1;
    const totalBidders = allBids.length;

    res.json({
      success: true,
      data: {
        userBid: {
          id: userBid.id,
          amount: userBid.amount,
          createdAt: userBid.createdAt,
          updatedAt: userBid.updatedAt
        },
        auction: {
          id: bid.id,
          startTime: bid.startTime,
          endTime: bid.endTime,
          status: bid.status,
          resultDeclared: bid.resultDeclared,
          diamond: bid.diamond
        },
        result: result ? {
          id: result.id,
          winningAmount: result.winningAmount,
          declaredAt: result.declaredAt,
          declaredBy: result.declaredBy,
          winner: result.winner
        } : null,
        userStatus: {
          status,
          statusMessage,
          isWinner,
          participated: true,
          rank: userRank,
          totalBidders,
          userAmount: userBid.amount,
          highestBid: allBids.length > 0 ? allBids[0].amount : 0
        },
        allBids: allBids.map(bid => ({
          userId: bid.userId,
          userName: bid.user.name,
          amount: bid.amount,
          isCurrentUser: bid.userId === userId,
          rank: allBids.findIndex(b => b.userId === bid.userId) + 1
        }))
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

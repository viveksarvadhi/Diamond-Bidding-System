const express = require('express');
const { Bid, UserBid, User, Diamond } = require('../models');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Get live bids from ACTIVE auctions only
router.get('/', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    // Get only ACTIVE auctions with their latest user bids
    const activeBids = await Bid.findAll({
      where: {
        status: 'ACTIVE'
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
          order: [['createdAt', 'DESC']],
          limit: parseInt(limit)
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filter and format live bids data
    const liveBids = activeBids.map(bid => {
      const userBids = bid.userBids || [];
      
      return {
        id: bid.id,
        diamond: bid.Diamond,
        baseBidPrice: bid.baseBidPrice,
        status: bid.status,
        startTime: bid.startTime,
        endTime: bid.endTime,
        totalBidders: new Set(userBids.map(ub => ub.userId)).size,
        highestBid: userBids.length > 0 ? userBids[0] : null,
        recentBids: userBids.slice(0, 5), // Latest 5 bids
        liveActivity: userBids.length > 0
      };
    });

    res.json({
      success: true,
      data: {
        liveBids,
        totalLiveAuctions: liveBids.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get latest live bids across all active auctions
router.get('/latest', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Get latest user bids from ACTIVE auctions only
    const latestUserBids = await UserBid.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Bid,
          where: {
            status: 'ACTIVE'
          },
          include: [
            {
              model: Diamond,
              as: 'diamond',
              attributes: ['id', 'name', 'basePrice']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });

    // Format the response
    const liveBids = latestUserBids.map(userBid => ({
      id: userBid.id,
      amount: userBid.amount,
      createdAt: userBid.createdAt,
      user: userBid.User,
      bid: userBid.Bid,
      diamond: userBid.Bid.Diamond
    }));

    res.json({
      success: true,
      data: {
        liveBids,
        totalBids: liveBids.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;

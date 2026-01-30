const cron = require('node-cron');
const { Bid, UserBid, User, Result, Diamond } = require('../models');
const { sequelize } = require('../config/database');
const { getSocketHandler } = require('../websocket');

class AuctionScheduler {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  // Start the auction scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️  Auction scheduler is already running');
      return;
    }

    console.log('🚀 Starting Auction Scheduler...');
    
    // Run every 10 seconds to check for expired auctions
    this.job = cron.schedule('*/10 * * * * *', async () => {
      await this.checkExpiredAuctions();
    });

    this.isRunning = true;
    console.log('✅ Auction Scheduler started - checking every 10 seconds');
  }

  // Stop the auction scheduler
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Auction scheduler is not running');
      return;
    }

    if (this.job) {
      this.job.stop();
      this.job = null;
    }

    this.isRunning = false;
    console.log('🛑 Auction Scheduler stopped');
  }

  // Check for expired auctions and close them
  async checkExpiredAuctions() {
    try {
      const now = new Date();
      
      // Find auctions where:
      // 1. end_time <= NOW() and status = ACTIVE and resultDeclared = false
      // OR
      // 2. status = CLOSED and resultDeclared = false (already closed but no result declared)
      const expiredAuctions = await Bid.findAll({
        where: {
          [require('sequelize').Op.or]: [
            {
              endTime: {
                [require('sequelize').Op.lte]: now
              },
              status: 'ACTIVE',
              resultDeclared: false
            },
            {
              status: 'CLOSED',
              resultDeclared: false
            }
          ]
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
        ]
      });

      if (expiredAuctions.length === 0) {
        return; // No expired auctions
      }

      console.log(`🔍 Found ${expiredAuctions.length} auction(s) to process`);

      // Process each expired auction
      for (const auction of expiredAuctions) {
        await this.closeAuction(auction);
      }

    } catch (error) {
      console.error('❌ Error checking expired auctions:', error);
    }
  }

  // Close a single auction and declare winner
  async closeAuction(auction) {
    try {
      console.log(`🏁 Processing auction: ${auction.diamond?.name || auction.id}`);
      console.log(`🔍 Auction data:`, {
        id: auction.id,
        status: auction.status,
        resultDeclared: auction.resultDeclared,
        userBidsCount: auction.userBids?.length || 0
      });

      // Update auction status to CLOSED
      await auction.update({
        status: 'CLOSED',
        resultDeclared: true
      });
      console.log(`✅ Auction status updated to CLOSED`);

      let winner = null;
      let winningAmount = auction.baseBidPrice;

      // Find the highest bid if there are any bids
      if (auction.userBids && auction.userBids.length > 0) {
        const highestBid = auction.userBids[0]; // Already ordered by amount DESC
        winner = highestBid.user;
        winningAmount = highestBid.amount;

        console.log(`🎯 Highest bid found:`, {
          winner: winner.name,
          amount: winningAmount,
          userId: winner.id
        });

        // Create result record with detailed logging
        try {
          const resultData = {
            bidId: auction.id,
            winnerUserId: winner.id,
            winningAmount: winningAmount,
            declaredBy: 3, // Use admin user ID (Admin User has ID 3)
            declaredAt: new Date()
          };
          
          console.log(`📝 Creating result with data:`, resultData);
          
          const result = await Result.create(resultData);
          console.log(`✅ Result created successfully:`, result.id);
          
        } catch (resultError) {
          console.error(`❌ ERROR creating result:`, resultError.message);
          console.error(`❌ Full error details:`, resultError);
          throw resultError; // Re-throw to be caught by outer try-catch
        }

        console.log(`🏆 Winner declared: ${winner.name} - $${winningAmount}`);
      } else {
        // No bids were placed
        console.log(`📭 No bids found, creating no-bid result`);
        
        try {
          const resultData = {
            bidId: auction.id,
            winnerUserId: null,
            winningAmount: 0,
            declaredBy: 3, // Use admin user ID (Admin User has ID 3)
            declaredAt: new Date()
          };
          
          console.log(`📝 Creating no-bid result with data:`, resultData);
          
          const result = await Result.create(resultData);
          console.log(`✅ No-bid result created successfully:`, result.id);
          
        } catch (resultError) {
          console.error(`❌ ERROR creating no-bid result:`, resultError.message);
          console.error(`❌ Full error details:`, resultError);
          throw resultError;
        }

        console.log(`📭 No bids placed for auction: ${auction.diamond?.name || auction.id}`);
      }

      // Emit real-time update to all connected clients
      this.broadcastAuctionResult(auction, winner, winningAmount);
      console.log(`📢 Real-time update broadcasted`);

    } catch (error) {
      console.error(`❌ Error closing auction ${auction.id}:`, error.message);
      console.error(`❌ Full error stack:`, error.stack);
    }
  }

  // Broadcast auction result to all connected clients
  broadcastAuctionResult(auction, winner, winningAmount) {
    try {
      const socketHandler = getSocketHandler();
      if (!socketHandler) {
        console.log('⚠️  Socket handler not available');
        return;
      }

      const resultData = {
        auctionId: auction.id,
        diamondName: auction.diamond?.name || 'Unknown Diamond',
        diamondId: auction.diamond?.id,
        status: 'CLOSED',
        winner: winner ? {
          id: winner.id,
          name: winner.name,
          email: winner.email
        } : null,
        winningAmount: winningAmount,
        totalBids: auction.userBids?.length || 0,
        endTime: auction.endTime,
        timestamp: new Date().toISOString()
      };

      // Broadcast to admin room
      socketHandler.io.to('admin').emit('auction-closed', resultData);
      
      // Broadcast to auction room
      socketHandler.io.to(`auction-${auction.id}`).emit('auction-closed', resultData);

      console.log(`📢 Auction result broadcasted: ${auction.diamond?.name || auction.id}`);

    } catch (error) {
      console.error('❌ Error broadcasting auction result:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: '10 seconds',
      nextRun: this.isRunning ? 'Every 10 seconds' : null
    };
  }
}

module.exports = new AuctionScheduler();

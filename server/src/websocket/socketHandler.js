const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socket.id
    this.auctionRooms = new Map(); // bidId -> Set of socket.ids
    
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected: ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.user.id, socket.id);

      // Join user to their role-based room
      const roleRoom = socket.user.role === 'ADMIN' ? 'admin' : 'users';
      socket.join(roleRoom);

      // Handle joining auction rooms
      socket.on('join-auction', (bidId) => {
        socket.join(`auction-${bidId}`);
        
        if (!this.auctionRooms.has(bidId)) {
          this.auctionRooms.set(bidId, new Set());
        }
        this.auctionRooms.get(bidId).add(socket.id);
        
        console.log(`User ${socket.user.name} joined auction ${bidId}`);
        
        // Send current auction status to the user
        this.sendAuctionUpdate(bidId);
      });

      // Handle leaving auction rooms
      socket.on('leave-auction', (bidId) => {
        socket.leave(`auction-${bidId}`);
        
        if (this.auctionRooms.has(bidId)) {
          this.auctionRooms.get(bidId).delete(socket.id);
          if (this.auctionRooms.get(bidId).size === 0) {
            this.auctionRooms.delete(bidId);
          }
        }
        
        console.log(`User ${socket.user.name} left auction ${bidId}`);
      });

      // Handle new bids
      socket.on('place-bid', async (data) => {
        try {
          const { bidId, amount } = data;
          
          // Validate bid data
          if (!bidId || !amount || amount <= 0) {
            socket.emit('bid-error', { message: 'Invalid bid data' });
            return;
          }

          // Here you would typically save the bid to the database
          // For now, we'll broadcast the bid to all users in the auction
          const bidData = {
            id: Date.now(), // Temporary ID
            bidId: bidId,
            userId: socket.user.id,
            userName: socket.user.name,
            amount: parseFloat(amount),
            timestamp: new Date().toISOString()
          };

          // Broadcast to all users in the auction room
          this.io.to(`auction-${bidId}`).emit('new-bid', bidData);
          
          // Send confirmation to the bidder
          socket.emit('bid-confirmed', bidData);
          
          console.log(`New bid placed: ${socket.user.name} bid $${amount} on auction ${bidId}`);
          
        } catch (error) {
          console.error('Error placing bid:', error);
          socket.emit('bid-error', { message: 'Failed to place bid' });
        }
      });

      // Handle getting current auction status
      socket.on('get-auction-status', (bidId) => {
        this.sendAuctionUpdate(bidId, socket.id);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.name} disconnected: ${socket.id}`);
        
        // Remove user from connected users
        this.connectedUsers.delete(socket.user.id);
        
        // Remove user from all auction rooms
        this.auctionRooms.forEach((sockets, bidId) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.auctionRooms.delete(bidId);
          }
        });
      });
    });
  }

  // Send auction update to specific room or socket
  async sendAuctionUpdate(bidId, socketId = null) {
    try {
      // Fetch current auction data from database
      const { Bid, UserBid, User } = require('../models');
      
      const bid = await Bid.findByPk(bidId, {
        include: [
          {
            model: UserBid,
            as: 'userBids',
            include: [
              {
                model: User,
                as: 'user',
                attributes: ['id', 'name']
              }
            ],
            order: [['amount', 'DESC']],
            limit: 10
          }
        ]
      });

      if (!bid) {
        return;
      }

      const auctionData = {
        id: bid.id,
        diamondId: bid.diamondId,
        status: bid.status,
        startTime: bid.startTime,
        endTime: bid.endTime,
        baseBidPrice: bid.baseBidPrice,
        currentBids: bid.userBids.map(ub => ({
          id: ub.id,
          userId: ub.userId,
          userName: ub.user.name,
          amount: ub.amount,
          timestamp: ub.createdAt
        })),
        highestBid: bid.userBids.length > 0 ? bid.userBids[0].amount : bid.baseBidPrice,
        totalBids: bid.userBids.length
      };

      // Send to specific socket or entire auction room
      if (socketId) {
        this.io.to(socketId).emit('auction-update', auctionData);
      } else {
        this.io.to(`auction-${bidId}`).emit('auction-update', auctionData);
      }
      
    } catch (error) {
      console.error('Error sending auction update:', error);
    }
  }

  // Broadcast auction status change
  broadcastAuctionStatus(bidId, status) {
    this.io.to(`auction-${bidId}`).emit('auction-status-changed', {
      bidId: bidId,
      status: status,
      timestamp: new Date().toISOString()
    });
  }

  // Broadcast new user joined auction
  broadcastUserJoined(bidId, user) {
    this.io.to(`auction-${bidId}`).emit('user-joined', {
      bidId: bidId,
      user: {
        id: user.id,
        name: user.name
      },
      timestamp: new Date().toISOString()
    });
  }

  // Get connected users count for an auction
  getAuctionViewerCount(bidId) {
    return this.auctionRooms.get(bidId)?.size || 0;
  }

  // Get total connected users
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }
}

module.exports = SocketHandler;

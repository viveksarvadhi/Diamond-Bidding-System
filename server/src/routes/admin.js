const express = require('express');
const { Bid, UserBid, Result, Diamond } = require('../models');
const { authenticate, adminOnly, adminOnlyDebug } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();

// Clean up database tables (remove duplicates)
router.post('/clean-database', authenticate, adminOnly, async (req, res, next) => {
  try {
    const { sequelize } = require('../config/database');
    
    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 All Tables Found:', tables.map(t => t.table_name));
    
    // Identify main tables vs duplicates
    const mainTables = ['users', 'diamonds', 'bids', 'userbids', 'results', 'sequelizemeta'];
    const allTableNames = tables.map(t => t.table_name);
    
    let droppedTables = [];
    let keptTables = [];
    
    // Find and drop duplicate tables
    for (const tableName of allTableNames) {
      // Skip main tables
      if (mainTables.includes(tableName.toLowerCase())) {
        keptTables.push(tableName);
        continue;
      }
      
      // Check if it's a duplicate (contains main table name with suffix)
      const isDuplicate = mainTables.some(mainTable => 
        tableName.toLowerCase().includes(mainTable) && 
        tableName.toLowerCase() !== mainTable
      );
      
      if (isDuplicate) {
        try {
          await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
          droppedTables.push(tableName);
          console.log(`🗑️  Dropped duplicate table: ${tableName}`);
        } catch (error) {
          console.log(`❌ Failed to drop ${tableName}: ${error.message}`);
        }
      } else {
        keptTables.push(tableName);
      }
    }
    
    // Get final table list
    const [finalTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    res.json({
      success: true,
      message: `Database cleanup completed! Dropped ${droppedTables.length} duplicate tables.`,
      droppedTables: droppedTables,
      keptTables: keptTables,
      finalTables: finalTables.map(t => t.table_name)
    });
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    next(error);
  }
});

// Clean up multiple admin users (keep only one)
router.post('/clean-admins', authenticate, async (req, res, next) => {
  try {
    const { User } = require('../models');
    
    // Find all admin users
    const allAdmins = await User.findAll({ 
      where: { role: 'ADMIN' },
      attributes: ['id', 'name', 'email', 'role'] 
    });
    
    if (allAdmins.length <= 1) {
      return res.json({
        success: true,
        message: 'Only one admin exists - no cleanup needed.',
        adminCount: allAdmins.length
      });
    }
    
    // Keep the first admin, make others USER
    const mainAdmin = allAdmins[0];
    const otherAdmins = allAdmins.slice(1);
    
    // Update other admins to USER role
    for (const admin of otherAdmins) {
      await User.update(
        { role: 'USER' },
        { where: { id: admin.id } }
      );
    }
    
    console.log(`🧹 Cleaned up ${otherAdmins.length} extra admins. Keeping: ${mainAdmin.name}`);
    
    res.json({
      success: true,
      message: `Cleaned up ${otherAdmins.length} extra admin users. Only ${mainAdmin.name} remains as admin.`,
      mainAdmin: {
        id: mainAdmin.id,
        name: mainAdmin.name,
        email: mainAdmin.email,
        role: mainAdmin.role
      },
      removedAdmins: otherAdmins.length,
      finalAdminCount: 1
    });
  } catch (error) {
    console.error('❌ Error cleaning admins:', error);
    next(error);
  }
});

// Fix user role to ADMIN (ensure only one admin)
router.post('/fix-admin-role', authenticate, async (req, res, next) => {
  try {
    const { User } = require('../models');
    
    // Get current user
    const currentUser = req.user;
    console.log('🔍 Current user:', currentUser);
    
    // First, clean up existing admins (make them USER)
    const existingAdmins = await User.findAll({ 
      where: { role: 'ADMIN' }
    });
    
    for (const admin of existingAdmins) {
      if (admin.id !== currentUser.id) {
        await User.update(
          { role: 'USER' },
          { where: { id: admin.id } }
        );
        console.log(`🔄 Changed ${admin.name} from ADMIN to USER`);
      }
    }
    
    // Update current user to ADMIN
    await User.update(
      { role: 'ADMIN' },
      { where: { id: currentUser.id } }
    );
    
    // Fetch updated user
    const updatedUser = await User.findByPk(currentUser.id);
    
    console.log('✅ User updated to ADMIN:', updatedUser);
    
    res.json({
      success: true,
      message: `User ${updatedUser.name} is now the sole ADMIN! Other admins changed to USER.`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      },
      previousAdminsRemoved: existingAdmins.length - 1
    });
  } catch (error) {
    console.error('❌ Error fixing admin role:', error);
    next(error);
  }
});

// Debug endpoint to check user authentication
router.get('/debug-user', authenticate, async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = req.user;
    
    res.json({
      success: true,
      message: 'User authenticated successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        },
        token: token ? 'Present' : 'Missing',
        tokenLength: token ? token.length : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all auction results for management
router.get('/results', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bids = await Bid.findAll({
      include: [
        {
          model: Diamond,
          attributes: ['id', 'name', 'carat', 'clarity', 'color', 'cut']
        },
        {
          model: UserBid,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ],
          order: [['amount', 'DESC']],
          limit: 1 // Get only the highest bid
        },
        {
          model: Result,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform the data
    const results = bids.map(bid => {
      const highestBid = bid.UserBids && bid.UserBids.length > 0 ? bid.UserBids[0] : null;
      
      return {
        id: bid.id,
        diamondId: bid.diamondId,
        diamond: bid.Diamond,
        baseBidPrice: bid.baseBidPrice,
        highestBid: highestBid ? {
          id: highestBid.id,
          amount: highestBid.amount,
          user: highestBid.User,
          createdAt: highestBid.createdAt
        } : null,
        totalBidders: bid.UserBids ? bid.UserBids.length : 0,
        startTime: bid.startTime,
        endTime: bid.endTime,
        status: bid.status,
        resultDeclared: bid.resultDeclared,
        result: bid.Result
      };
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
});

// Create active auction immediately (Admin only)
router.post('/create-active-auction', authenticate, adminOnlyDebug, async (req, res, next) => {
  try {
    const { diamondId, baseBidPrice, durationMinutes = 24 * 60 } = req.body; // Default 24 hours in minutes

    // Validation schema
    const schema = Joi.object({
      diamondId: Joi.number().integer().positive().required(),
      baseBidPrice: Joi.number().positive().precision(2).required(),
      durationMinutes: Joi.number().positive().default(24 * 60) // Default 24 hours in minutes
    });

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

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

    // Create auction with current time as start time
    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000); // durationMinutes in minutes

    const bid = await Bid.create({
      diamondId,
      baseBidPrice,
      startTime: now,
      endTime: endTime,
      status: 'ACTIVE' // Set to ACTIVE immediately
    }, {
      validate: false // Bypass validation for admin
    });

    res.json({
      success: true,
      message: 'Active auction created successfully',
      data: {
        bid: {
          id: bid.id,
          diamondId: bid.diamondId,
          baseBidPrice: bid.baseBidPrice,
          startTime: bid.startTime,
          endTime: bid.endTime,
          status: bid.status,
          diamond: {
            id: diamond.id,
            name: diamond.name,
            basePrice: diamond.basePrice
          }
        }
      }
    });
  } catch (error) {
    console.error('Error creating active auction:', error);
    next(error);
  }
});

// Force delete any bid (Admin only - emergency use)
router.delete('/force-delete-bid/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bidId = req.params.id;

    // Find the bid
    const bid = await Bid.findByPk(bidId);
    if (!bid) {
      return res.status(404).json({
        success: false,
        message: 'Bid not found'
      });
    }

    // Delete related user bids first
    await UserBid.destroy({
      where: { bidId: bidId }
    });

    // Delete related result if exists
    await Result.destroy({
      where: { bidId: bidId }
    });

    // Delete the bid
    await bid.destroy();

    res.json({
      success: true,
      message: `Bid ${bidId} and all related data deleted successfully`
    });
  } catch (error) {
    console.error('Error force deleting bid:', error);
    next(error);
  }
});

// Delete all bids (Admin only - emergency use)
router.delete('/delete-all-bids', authenticate, adminOnly, async (req, res, next) => {
  try {
    // Delete all user bids first
    await UserBid.destroy({
      where: {}
    });

    // Delete all results
    await Result.destroy({
      where: {}
    });

    // Delete all bids
    const deletedCount = await Bid.destroy({
      where: {}
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} bids and all related data`
    });
  } catch (error) {
    console.error('Error deleting all bids:', error);
    next(error);
  }
});

// Delete all user bids for a specific bid
router.delete('/delete-user-bids/:bidId', authenticate, adminOnly, async (req, res, next) => {
  try {
    const bidId = req.params.bidId;

    // Delete user bids
    const deletedCount = await UserBid.destroy({
      where: { bidId: bidId }
    });

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} user bids for bid ${bidId}`
    });
  } catch (error) {
    console.error('Error deleting user bids:', error);
    next(error);
  }
});

module.exports = router;

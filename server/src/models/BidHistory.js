const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BidHistory = sequelize.define('BidHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userBidId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'user_bids',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  oldAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    validate: {
      isDecimal: {
        msg: 'Old amount must be a valid decimal number'
      }
    }
  },
  newAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'New amount must be a valid decimal number'
      },
      min: {
        args: [0],
        msg: 'New amount must be greater than or equal to 0'
      }
    }
  }
}, {
  tableName: 'bid_history',
  timestamps: true,
  updatedAt: false // Only track when the change was made
});

module.exports = BidHistory;

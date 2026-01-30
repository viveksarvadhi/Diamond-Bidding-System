const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserBid = sequelize.define('UserBid', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  bidId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bids',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Bid amount must be a valid decimal number'
      },
      min: {
        args: [0],
        msg: 'Bid amount must be greater than or equal to 0'
      }
    }
  }
}, {
  tableName: 'user_bids',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'bidId'],
      name: 'unique_user_bid'
    }
  ]
});

module.exports = UserBid;

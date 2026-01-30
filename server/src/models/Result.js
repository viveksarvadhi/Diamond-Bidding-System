const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Result = sequelize.define('Result', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bidId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: {
      msg: 'A result already exists for this bid'
    },
    references: {
      model: 'bids',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  winnerUserId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for auctions with no bids
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  winningAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Winning amount must be a valid decimal number'
      },
      min: {
        args: [0], // Allow 0 for auctions with no bids
        msg: 'Winning amount must be 0 or greater'
      }
    }
  },
  declaredAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  declaredBy: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for system-declared results
    references: {
      model: 'users',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'results',
  timestamps: true,
  createdAt: false, // Only use declaredAt for creation time
  updatedAt: false  // Results should not be updated
});

module.exports = Result;

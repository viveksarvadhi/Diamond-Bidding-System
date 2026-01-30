const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Bid = sequelize.define('Bid', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  diamondId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'diamonds',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  baseBidPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Base bid price must be a valid decimal number'
      },
      min: {
        args: [0.01],
        msg: 'Base bid price must be greater than 0'
      }
    }
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Start time must be a valid date'
      },
      isNotTooFarInPast(value) {
        const now = new Date();
        const startTime = new Date(value);
        const timeDiff = now - startTime;
        // Allow up to 5 minutes in the past for timezone sync
        if (timeDiff > 5 * 60 * 1000) {
          throw new Error('Start time cannot be more than 5 minutes in the past');
        }
      }
    }
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'End time must be a valid date'
      },
      isAfterStart(value) {
        if (new Date(value) <= new Date(this.startTime)) {
          throw new Error('End time must be after start time');
        }
      }
    }
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'ACTIVE', 'CLOSED'),
    allowNull: false,
    defaultValue: 'DRAFT',
    validate: {
      isIn: {
        args: [['DRAFT', 'ACTIVE', 'CLOSED']],
        msg: 'Status must be DRAFT, ACTIVE, or CLOSED'
      }
    }
  },
  resultDeclared: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'bids',
  timestamps: true,
  hooks: {
    beforeUpdate: (bid) => {
      // Auto-update status based on time
      const now = new Date();
      const endTime = new Date(bid.endTime);
      
      if (endTime <= now && bid.status === 'ACTIVE') {
        bid.status = 'CLOSED';
      }
    }
  }
});

module.exports = Bid;

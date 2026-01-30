const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Diamond = sequelize.define('Diamond', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Diamond name is required'
      },
      len: {
        args: [2, 255],
        msg: 'Diamond name must be between 2 and 255 characters'
      }
    }
  },
  basePrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Base price must be a valid decimal number'
      },
      min: {
        args: [0.01],
        msg: 'Base price must be greater than 0'
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: {
        msg: 'Image URL must be a valid URL'
      }
    }
  }
}, {
  tableName: 'diamonds',
  timestamps: true
});

module.exports = Diamond;

const User = require('./User');
const Diamond = require('./Diamond');
const Bid = require('./Bid');
const UserBid = require('./UserBid');
const BidHistory = require('./BidHistory');
const Result = require('./Result');

// Define associations

// User has many UserBids
User.hasMany(UserBid, {
  foreignKey: 'userId',
  as: 'userBids',
  onDelete: 'CASCADE'
});

// User has many Results (as winner)
User.hasMany(Result, {
  foreignKey: 'winnerUserId',
  as: 'wonResults',
  onDelete: 'CASCADE'
});

// User has many Results (as declarer)
User.hasMany(Result, {
  foreignKey: 'declaredBy',
  as: 'declaredResults',
  onDelete: 'SET NULL'
});

// Diamond has many Bids
Diamond.hasMany(Bid, {
  foreignKey: 'diamondId',
  as: 'bids',
  onDelete: 'CASCADE'
});

// Bid belongs to Diamond
Bid.belongsTo(Diamond, {
  foreignKey: 'diamondId',
  as: 'diamond'
});

// Bid has many UserBids
Bid.hasMany(UserBid, {
  foreignKey: 'bidId',
  as: 'userBids',
  onDelete: 'CASCADE'
});

// Bid has one Result
Bid.hasOne(Result, {
  foreignKey: 'bidId',
  as: 'result',
  onDelete: 'CASCADE'
});

// UserBid belongs to User
UserBid.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// UserBid belongs to Bid
UserBid.belongsTo(Bid, {
  foreignKey: 'bidId',
  as: 'bid'
});

// UserBid has many BidHistory
UserBid.hasMany(BidHistory, {
  foreignKey: 'userBidId',
  as: 'bidHistory',
  onDelete: 'CASCADE'
});

// BidHistory belongs to UserBid
BidHistory.belongsTo(UserBid, {
  foreignKey: 'userBidId',
  as: 'userBid'
});

// Result belongs to Bid
Result.belongsTo(Bid, {
  foreignKey: 'bidId',
  as: 'bid'
});

// Result belongs to User (winner)
Result.belongsTo(User, {
  foreignKey: 'winnerUserId',
  as: 'winner'
});

// Result belongs to User (declarer)
Result.belongsTo(User, {
  foreignKey: 'declaredBy',
  as: 'declarer'
});

module.exports = {
  User,
  Diamond,
  Bid,
  UserBid,
  BidHistory,
  Result
};

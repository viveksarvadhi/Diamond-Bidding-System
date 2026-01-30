# Diamond Bidding System - Database Schema

## Overview
Production-ready PostgreSQL database schema for Diamond Bidding System with proper relationships, constraints, and business logic enforcement.

## Database Models

### 1. Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hashed
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'USER')),
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Diamonds Table
```sql
CREATE TABLE diamonds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    basePrice DECIMAL(15,2) NOT NULL CHECK (basePrice > 0),
    description TEXT,
    image_url VARCHAR(500),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Bids Table
```sql
CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    diamondId INTEGER NOT NULL REFERENCES diamonds(id) ON DELETE CASCADE,
    baseBidPrice DECIMAL(15,2) NOT NULL CHECK (baseBidPrice > 0),
    startTime TIMESTAMP NOT NULL,
    endTime TIMESTAMP NOT NULL CHECK (endTime > startTime),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    resultDeclared BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. UserBids Table
```sql
CREATE TABLE user_bids (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bidId INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, bidId) -- One bid per user per auction
);
```

### 5. BidHistory Table
```sql
CREATE TABLE bid_history (
    id SERIAL PRIMARY KEY,
    userBidId INTEGER NOT NULL REFERENCES user_bids(id) ON DELETE CASCADE,
    oldAmount DECIMAL(15,2),
    newAmount DECIMAL(15,2) NOT NULL,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6. Results Table
```sql
CREATE TABLE results (
    id SERIAL PRIMARY KEY,
    bidId INTEGER NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
    winnerUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    winningAmount DECIMAL(15,2) NOT NULL CHECK (winningAmount > 0),
    declaredAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    declaredBy INTEGER NOT NULL REFERENCES users(id),
    UNIQUE(bidId) -- One result per bid
);
```

## Business Logic Constraints

### Bid Status Management
- **DRAFT**: Can be edited/deleted by admin
- **ACTIVE**: Bidding open, cannot be edited/deleted
- **CLOSED**: Bidding ended, read-only

### Time-based Status Updates
```sql
-- Function to update bid status based on time
CREATE OR REPLACE FUNCTION update_bid_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.endTime <= CURRENT_TIMESTAMP AND NEW.status = 'ACTIVE' THEN
        NEW.status := 'CLOSED';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update status
CREATE TRIGGER bid_status_trigger
    BEFORE UPDATE ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_bid_status();
```

### Bid Validation Rules
1. Users can only bid on ACTIVE bids
2. Bid amount must be >= baseBidPrice
3. Only one bid per user per bid
4. Cannot edit bids after endTime
5. Every edit creates BidHistory record

### Result Declaration Rules
1. Only admin can declare results
2. Only after bid endTime
3. Only once per bid
4. Winner must have highest bid

## Indexes for Performance
```sql
-- User authentication
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Bid queries
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_diamond_id ON bids(diamondId);
CREATE INDEX idx_bids_time_range ON bids(startTime, endTime);

-- User bid lookups
CREATE INDEX idx_user_bids_user_id ON user_bids(userId);
CREATE INDEX idx_user_bids_bid_id ON user_bids(bidId);
CREATE INDEX idx_user_bids_amount ON user_bids(amount);

-- History tracking
CREATE INDEX idx_bid_history_user_bid_id ON bid_history(userBidId);
CREATE INDEX idx_bid_history_updated_at ON bid_history(updatedAt);
```

## Data Integrity

### Foreign Key Constraints
- All relationships properly enforced
- CASCADE delete for dependent records
- Referential integrity maintained

### Check Constraints
- Positive prices and amounts
- Valid role values
- Valid status values
- Time logic (endTime > startTime)

### Unique Constraints
- Email uniqueness
- One bid per user per auction
- One result per bid

## Sample Data Structure

### Test Users
- Admin: admin@diamonds.com (ADMIN)
- User A-E: user[a-e]@diamonds.com (USER)

### Test Diamonds
- Diamond 1: "Royal Blue Diamond" - basePrice: $10000
- Diamond 2: "Pink Diamond" - basePrice: $15000

### Test Bids
- Bid 1: Diamond 1, 24-hour window
- Bid 2: Diamond 2, 24-hour window

## Security Considerations

1. **Password Security**: bcrypt hashing
2. **Data Access**: Role-based permissions
3. **Audit Trail**: BidHistory for all changes
4. **Transaction Safety**: Sequelize transactions for bid operations
5. **SQL Injection Prevention**: Parameterized queries via Sequelize

## Performance Optimization

1. **Indexing**: Strategic indexes for common queries
2. **Query Optimization**: Efficient joins and aggregations
3. **Connection Pooling**: PostgreSQL connection pool
4. **Caching**: Redis for frequently accessed data (optional)

-- Diamond Bidding System Database Schema
-- PostgreSQL Tables

-- Users Table
CREATE TABLE IF NOT EXISTS "Users" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) DEFAULT 'USER' CHECK ("role" IN ('USER', 'ADMIN')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Diamonds Table
CREATE TABLE IF NOT EXISTS "Diamonds" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255) UNIQUE NOT NULL,
  "baseprice" DECIMAL(10,2) NOT NULL CHECK (baseprice > 0),
  "description" TEXT,
  "image_url" VARCHAR(500),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bids Table (Auction Events)
CREATE TABLE IF NOT EXISTS "Bids" (
  "id" SERIAL PRIMARY KEY,
  "diamondId" INTEGER NOT NULL REFERENCES "Diamonds"("id") ON DELETE CASCADE,
  "basebidprice" DECIMAL(10,2) NOT NULL CHECK (basebidprice > 0),
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP NOT NULL,
  "status" VARCHAR(50) DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'ACTIVE', 'CLOSED')),
  "resultDeclared" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UserBids Table (Individual User Bids)
CREATE TABLE IF NOT EXISTS "UserBids" (
  "id" SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "bidId" INTEGER NOT NULL REFERENCES "Bids"("id") ON DELETE CASCADE,
  "amount" DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BidHistory Table (Audit Trail for Bid Changes)
CREATE TABLE IF NOT EXISTS "BidHistories" (
  "id" SERIAL PRIMARY KEY,
  "userBidId" INTEGER NOT NULL REFERENCES "UserBids"("id") ON DELETE CASCADE,
  "oldAmount" DECIMAL(10,2),
  "newAmount" DECIMAL(10,2) NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Results Table (Auction Results)
CREATE TABLE IF NOT EXISTS "Results" (
  "id" SERIAL PRIMARY KEY,
  "bidId" INTEGER NOT NULL REFERENCES "Bids"("id") ON DELETE CASCADE,
  "winnerUserId" INTEGER NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
  "winningamount" DECIMAL(10,2) NOT NULL CHECK (winningamount > 0),
  "declaredAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "declaredBy" INTEGER NOT NULL REFERENCES "Users"("id")
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "Users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_role" ON "Users"("role");
CREATE INDEX IF NOT EXISTS "idx_users_active" ON "Users"("isActive");

CREATE INDEX IF NOT EXISTS "idx_diamonds_name" ON "Diamonds"("name");
CREATE INDEX IF NOT EXISTS "idx_diamonds_baseprice" ON "Diamonds"("baseprice");

CREATE INDEX IF NOT EXISTS "idx_bids_diamondId" ON "Bids"("diamondId");
CREATE INDEX IF NOT EXISTS "idx_bids_status" ON "Bids"("status");
CREATE INDEX IF NOT EXISTS "idx_bids_startTime" ON "Bids"("startTime");
CREATE INDEX IF NOT EXISTS "idx_bids_endTime" ON "Bids"("endTime");

CREATE INDEX IF NOT EXISTS "idx_userBids_userId" ON "UserBids"("userId");
CREATE INDEX IF NOT EXISTS "idx_userBids_bidId" ON "UserBids"("bidId");
CREATE INDEX IF NOT EXISTS "idx_userBids_amount" ON "UserBids"("amount");

CREATE INDEX IF NOT EXISTS "idx_bidHistories_userBidId" ON "BidHistories"("userBidId");

CREATE INDEX IF NOT EXISTS "idx_results_bidId" ON "Results"("bidId");
CREATE INDEX IF NOT EXISTS "idx_results_winnerUserId" ON "Results"("winnerUserId");

-- Trigger to automatically update updatedAt column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updatedAt = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diamonds_updated_at BEFORE UPDATE ON "Diamonds" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON "Bids" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_userBids_updated_at BEFORE UPDATE ON "UserBids" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

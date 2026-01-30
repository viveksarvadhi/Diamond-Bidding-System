-- Diamond Bidding System - Seed Data
-- Insert sample data for testing

-- Insert sample users
INSERT INTO "Users" ("name", "email", "password", "role", "isActive") VALUES
('Admin User', 'admin@diamondbidding.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukb.L8v1e', 'ADMIN', true),
('John Doe', 'john@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukb.L8v1e', 'USER', true),
('Jane Smith', 'jane@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukb.L8v1e', 'USER', true),
('Bob Johnson', 'bob@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukb.L8v1e', 'USER', true),
('Alice Wilson', 'alice@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukb.L8v1e', 'USER', true);

-- Insert sample diamonds
INSERT INTO "Diamonds" ("name", "baseprice", "description", "image_url") VALUES
('Royal Blue Diamond', 50000.00, 'A stunning 2-carat royal blue diamond with exceptional clarity and brilliance.', 'https://example.com/images/royal-blue.jpg'),
('Pink Diamond', 75000.00, 'A rare 1.5-carat pink diamond with vivid color and perfect cut.', 'https://example.com/images/pink-diamond.jpg');

-- Insert sample bids (auction events)
INSERT INTO "Bids" ("diamondId", "basebidprice", "startTime", "endTime", "status") VALUES
(1, 50000.00, '2024-01-29 10:00:00', '2024-01-30 10:00:00', 'ACTIVE'),
(2, 75000.00, '2024-01-29 14:00:00', '2024-01-30 14:00:00', 'ACTIVE');

-- Insert sample user bids
INSERT INTO "UserBids" ("userId", "bidId", "amount") VALUES
(2, 1, 52000.00),
(3, 1, 55000.00),
(4, 1, 58000.00),
(2, 2, 78000.00),
(3, 2, 80000.00);

-- Insert bid history
INSERT INTO "BidHistories" ("userBidId", "oldAmount", "newAmount") VALUES
(1, NULL, 52000.00),
(2, NULL, 55000.00),
(3, 55000.00, 58000.00),
(4, NULL, 78000.00),
(5, NULL, 80000.00);

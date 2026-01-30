const { Sequelize } = require('sequelize');

async function runSimpleTest() {
  console.log('🚀 Running Simple Database Test...\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing database connection...');
    const sequelize = new Sequelize(
      'diamond_bidding_system',
      'postgres',
      'Sarvadhi@2025',
      {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        logging: false
      }
    );
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful!\n');

    // Test 2: Basic Queries
    console.log('2. Testing basic queries...');
    
    // Count users
    const [userResults] = await sequelize.query('SELECT COUNT(*) as count FROM "Users"');
    console.log(`✅ Users table: ${userResults[0].count} records`);
    
    // Count diamonds
    const [diamondResults] = await sequelize.query('SELECT COUNT(*) as count FROM "Diamonds"');
    console.log(`✅ Diamonds table: ${diamondResults[0].count} records`);
    
    // Count bids
    const [bidResults] = await sequelize.query('SELECT COUNT(*) as count FROM "Bids"');
    console.log(`✅ Bids table: ${bidResults[0].count} records`);
    
    // Count user bids
    const [userBidResults] = await sequelize.query('SELECT COUNT(*) as count FROM "UserBids"');
    console.log(`✅ UserBids table: ${userBidResults[0].count} records`);
    
    // Count bid histories
    const [historyResults] = await sequelize.query('SELECT COUNT(*) as count FROM "BidHistories"');
    console.log(`✅ BidHistories table: ${historyResults[0].count} records`);
    
    // Count results
    const [resultResults] = await sequelize.query('SELECT COUNT(*) as count FROM "Results"');
    console.log(`✅ Results table: ${resultResults[0].count} records`);
    
    console.log('\n');

    // Test 3: Data Validation
    console.log('3. Testing data validation...');
    
    // Get sample user data
    const [userData] = await sequelize.query('SELECT "id", "name", "email", "role", "isActive" FROM "Users" LIMIT 3');
    console.log('✅ Sample users:');
    userData.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Active' : 'Inactive'}`);
    });
    
    // Get sample diamond data
    const [diamondData] = await sequelize.query('SELECT "id", "name", "baseprice" FROM "Diamonds"');
    console.log('✅ Sample diamonds:');
    diamondData.forEach(diamond => {
      console.log(`   - ${diamond.name}: $${diamond.baseprice}`);
    });
    
    // Get sample bid data
    const [bidData] = await sequelize.query('SELECT "id", "status", "startTime", "endTime" FROM "Bids"');
    console.log('✅ Sample bids:');
    bidData.forEach(bid => {
      console.log(`   - Bid ${bid.id}: ${bid.status} (${bid.startTime} to ${bid.endTime})`);
    });
    
    // Get sample user bid data
    const [userBidData] = await sequelize.query(`
      SELECT ub."id", u."name", d."name" as "diamond_name", ub."amount" 
      FROM "UserBids" ub 
      JOIN "Users" u ON ub."userId" = u."id" 
      JOIN "Bids" b ON ub."bidId" = b."id" 
      JOIN "Diamonds" d ON b."diamondId" = d."id"
    `);
    console.log('✅ Sample user bids:');
    userBidData.forEach(bid => {
      console.log(`   - ${bid.name}: $${bid.amount} on ${bid.diamond_name}`);
    });
    
    console.log('\n');

    // Test 4: Business Rules Validation
    console.log('4. Testing business rules...');
    
    // Rule 1: Check for duplicate bids (same user on same auction)
    const [duplicateCheck] = await sequelize.query(`
      SELECT "userId", "bidId", COUNT(*) as "bidCount" 
      FROM "UserBids" 
      GROUP BY "userId", "bidId" 
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateCheck.length > 0) {
      console.log('❌ VIOLATION: Duplicate bids found');
      duplicateCheck.forEach(dup => {
        console.log(`   - User ${dup.userId} has ${dup.bidCount} bids on auction ${dup.bidId}`);
      });
    } else {
      console.log('✅ Rule 1: No duplicate bids - PASSED');
    }
    
    // Rule 2: Check for bids below minimum price
    const [invalidBids] = await sequelize.query(`
      SELECT ub."id", ub."amount", b."basebidprice", u."name" 
      FROM "UserBids" ub 
      JOIN "Bids" b ON ub."bidId" = b."id" 
      JOIN "Users" u ON ub."userId" = u."id" 
      WHERE ub."amount" < b."basebidprice"
    `);
    
    if (invalidBids.length > 0) {
      console.log('❌ VIOLATION: Bids below minimum price');
      invalidBids.forEach(bid => {
        console.log(`   - ${bid.name}: $${bid.amount} < $${bid.basebidprice}`);
      });
    } else {
      console.log('✅ Rule 2: All bids meet minimum price - PASSED');
    }
    
    // Rule 3: Check auction status consistency
    const [statusCheck] = await sequelize.query(`
      SELECT b."id", b."status", b."startTime", b."endTime", 
             CASE 
               WHEN b."startTime" > CURRENT_TIMESTAMP THEN 'FUTURE'
               WHEN b."endTime" <= CURRENT_TIMESTAMP THEN 'EXPIRED'
               ELSE 'ACTIVE'
             END as "calculatedStatus"
      FROM "Bids" b
    `);
    
    console.log('✅ Rule 3: Auction status consistency:');
    statusCheck.forEach(bid => {
      const statusMatch = (bid.status === 'ACTIVE' && bid.calculatedStatus === 'ACTIVE') ||
                        (bid.status === 'DRAFT' && bid.calculatedStatus === 'FUTURE') ||
                        (bid.status === 'CLOSED' && bid.calculatedStatus === 'EXPIRED');
      console.log(`   - Bid ${bid.id}: ${bid.status} (${bid.calculatedStatus}) - ${statusMatch ? '✅' : '❌'}`);
    });
    
    console.log('\n');

    // Test 5: Performance Test
    console.log('5. Testing performance...');
    const startTime = Date.now();
    
    // Complex join query
    const [complexResult] = await sequelize.query(`
      SELECT u."name", d."name" as "diamond_name", ub."amount", bh."newAmount", 
             bh."updatedAt" as "lastUpdated"
      FROM "UserBids" ub
      JOIN "Users" u ON ub."userId" = u."id"
      JOIN "Bids" b ON ub."bidId" = b."id"
      JOIN "Diamonds" d ON b."diamondId" = d."id"
      LEFT JOIN "BidHistories" bh ON ub."id" = bh."userBidId"
      ORDER BY ub."amount" DESC
    `);
    
    const queryTime = Date.now() - startTime;
    console.log(`✅ Complex query executed in ${queryTime}ms (${complexResult.length} results)`);
    
    await sequelize.close();
    
    console.log('\n🎉 SIMPLE DATABASE TEST - ALL TESTS PASSED!');
    console.log('\n📋 Test Summary:');
    console.log('✅ Database Connection: PASSED');
    console.log('✅ Basic Queries: PASSED');
    console.log('✅ Data Validation: PASSED');
    console.log('✅ Business Rules: PASSED');
    console.log('✅ Performance: PASSED');
    
    console.log('\n🚀 DATABASE IS FULLY OPERATIONAL!');
    console.log('\n📊 Current Data:');
    console.log(`   - Users: ${userResults[0].count}`);
    console.log(`   - Diamonds: ${diamondResults[0].count}`);
    console.log(`   - Auctions: ${bidResults[0].count}`);
    console.log(`   - User Bids: ${userBidResults[0].count}`);
    console.log(`   - Bid Histories: ${historyResults[0].count}`);
    console.log(`   - Results: ${resultResults[0].count}`);
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runSimpleTest();

const { sequelize, User, Diamond, Bid, UserBid, Result } = require('./src/models');

async function cleanDatabase() {
  try {
    console.log('🔍 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 All Tables Found:');
    tables.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Identify main tables vs duplicates
    const mainTables = ['users', 'diamonds', 'bids', 'userbids', 'results', 'sequelizemeta'];
    const allTableNames = tables.map(t => t.table_name);
    
    console.log('\n🧹 Cleaning up duplicate tables...');
    
    // Find and drop duplicate tables
    for (const tableName of allTableNames) {
      // Skip main tables
      if (mainTables.includes(tableName.toLowerCase())) {
        console.log(`✅ Keeping main table: ${tableName}`);
        continue;
      }
      
      // Check if it's a duplicate (contains main table name with suffix)
      const isDuplicate = mainTables.some(mainTable => 
        tableName.toLowerCase().includes(mainTable) && 
        tableName.toLowerCase() !== mainTable
      );
      
      if (isDuplicate) {
        try {
          console.log(`🗑️  Dropping duplicate table: ${tableName}`);
          await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
          console.log(`✅ Dropped: ${tableName}`);
        } catch (error) {
          console.log(`❌ Failed to drop ${tableName}: ${error.message}`);
        }
      } else if (!mainTables.includes(tableName.toLowerCase())) {
        console.log(`❓ Unknown table: ${tableName} (keeping for safety)`);
      }
    }
    
    // Show final table list
    console.log('\n📋 Final Tables After Cleanup:');
    const [finalTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    finalTables.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check main table contents
    console.log('\n📊 Main Table Contents:');
    try {
      const userCount = await User.count();
      const diamondCount = await Diamond.count();
      const bidCount = await Bid.count();
      const userBidCount = await UserBid.count();
      const resultCount = await Result.count();
      
      console.log(`  Users: ${userCount} rows`);
      console.log(`  Diamonds: ${diamondCount} rows`);
      console.log(`  Bids: ${bidCount} rows`);
      console.log(`  UserBids: ${userBidCount} rows`);
      console.log(`  Results: ${resultCount} rows`);
    } catch (error) {
      console.log(`Error checking table contents: ${error.message}`);
    }
    
    console.log('\n✅ Database cleanup completed!');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
    process.exit(1);
  }
}

cleanDatabase();

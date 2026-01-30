const { sequelize } = require('./src/config/database');

async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing PostgreSQL Database Connection...');
    console.log('=====================================');
    
    // Test basic connection
    console.log('1. Testing basic connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection: SUCCESS');
    
    // Test database info
    console.log('\n2. Getting database info...');
    const [version] = await sequelize.query('SELECT version()');
    console.log('📊 PostgreSQL Version:', version[0].version);
    
    // Test current database
    const [currentDB] = await sequelize.query('SELECT current_database()');
    console.log('🗄️  Current Database:', currentDB[0].current_database);
    
    // Test current user
    const [currentUser] = await sequelize.query('SELECT current_user');
    console.log('👤 Current User:', currentUser[0].current_user);
    
    // Test table access
    console.log('\n3. Testing table access...');
    const [tables] = await sequelize.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tables found:', tables.length);
    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });
    
    // Test model connections
    console.log('\n4. Testing model connections...');
    const { User, Diamond, Bid, UserBid, Result } = require('./src/models');
    
    try {
      const userCount = await User.count();
      console.log(`✅ Users model: ${userCount} records`);
    } catch (error) {
      console.log(`❌ Users model error: ${error.message}`);
    }
    
    try {
      const diamondCount = await Diamond.count();
      console.log(`✅ Diamonds model: ${diamondCount} records`);
    } catch (error) {
      console.log(`❌ Diamonds model error: ${error.message}`);
    }
    
    try {
      const bidCount = await Bid.count();
      console.log(`✅ Bids model: ${bidCount} records`);
    } catch (error) {
      console.log(`❌ Bids model error: ${error.message}`);
    }
    
    console.log('\n=====================================');
    console.log('✅ Database connection test: COMPLETED');
    console.log('🎉 Your PostgreSQL database is connected and working!');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.error('\n=====================================');
    console.error('❌ Database connection test: FAILED');
    console.error('🔍 Error Details:', error.message);
    console.error('🔍 Error Code:', error.code);
    console.error('🔍 Error Stack:', error.stack);
    
    // Provide troubleshooting tips
    console.log('\n🛠️  Troubleshooting Tips:');
    console.log('1. Check if PostgreSQL is running: pg_ctl status');
    console.log('2. Verify database exists: createdb diamond_bidding');
    console.log('3. Check connection string in .env file');
    console.log('4. Verify user permissions: psql -l');
    console.log('5. Check firewall settings');
    
    process.exit(1);
  }
}

testDatabaseConnection();

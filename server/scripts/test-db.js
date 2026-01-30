const { Sequelize } = require('sequelize');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
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
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT COUNT(*) as userCount FROM "Users"');
    console.log(`✅ Found ${results[0].userCount} users in database`);
    
    const [diamondResults] = await sequelize.query('SELECT COUNT(*) as diamondCount FROM "Diamonds"');
    console.log(`✅ Found ${diamondResults[0].diamondCount} diamonds in database`);
    
    await sequelize.close();
    console.log('✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  }
}

testDatabase();

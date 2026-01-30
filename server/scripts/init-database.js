const { sequelize } = require('../src/config/database');
require('../src/models'); // Import all models to ensure they are defined

async function initializeDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection successful!');
    
    console.log('Creating tables...');
    await sequelize.sync({ force: true });
    console.log('Tables created successfully!');
    
    console.log('Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

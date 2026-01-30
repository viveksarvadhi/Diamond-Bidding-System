const { sequelize } = require('./src/config/database');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Get all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 All Tables in Database:');
    tables.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n🔍 Checking for duplicate/multiple tables...');
    
    // Check for common table patterns that might be duplicated
    const tableNames = tables.map(t => t.table_name);
    
    // Look for potential duplicates
    const duplicates = {};
    tableNames.forEach(name => {
      const baseName = name.replace(/_\d+$/, '').replace(/_duplicate$/, '').replace(/_backup$/, '').replace(/_old$/, '');
      if (!duplicates[baseName]) {
        duplicates[baseName] = [];
      }
      duplicates[baseName].push(name);
    });
    
    console.log('\n🚨 Potential Duplicate Tables:');
    Object.keys(duplicates).forEach(baseName => {
      if (duplicates[baseName].length > 1) {
        console.log(`  ⚠️  ${baseName}:`);
        duplicates[baseName].forEach(name => {
          console.log(`    - ${name}`);
        });
      }
    });
    
    // Check table contents
    console.log('\n📊 Table Contents:');
    for (const table of tables) {
      try {
        const [count] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
        console.log(`  ${table.table_name}: ${count[0].count} rows`);
      } catch (error) {
        console.log(`  ${table.table_name}: Error checking count - ${error.message}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    process.exit(1);
  }
}

checkDatabase();

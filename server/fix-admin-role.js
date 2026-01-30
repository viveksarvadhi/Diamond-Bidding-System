const { User } = require('./src/models');

async function fixAdminRole() {
  try {
    console.log('🔍 Checking users...');
    
    // Find all users
    const users = await User.findAll({ 
      attributes: ['id', 'name', 'email', 'role'] 
    });
    
    console.log('📋 All Users:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Update first user to ADMIN if no admin exists
    const adminExists = users.some(user => user.role === 'ADMIN');
    
    if (!adminExists && users.length > 0) {
      const firstUser = users[0];
      console.log(`\n🔧 Making ${firstUser.name} an ADMIN...`);
      
      await User.update(
        { role: 'ADMIN' },
        { where: { id: firstUser.id } }
      );
      
      console.log(`✅ ${firstUser.name} is now ADMIN!`);
    } else if (adminExists) {
      console.log('\n✅ Admin user already exists');
    } else {
      console.log('\n❌ No users found');
    }
    
    // Show final user list
    const updatedUsers = await User.findAll({ 
      attributes: ['id', 'name', 'email', 'role'] 
    });
    
    console.log('\n📋 Final User List:');
    updatedUsers.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAdminRole();

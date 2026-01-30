const { User } = require('./src/models');

async function cleanAdminUsers() {
  try {
    console.log('🔍 Checking all users...');
    
    // Find all users
    const users = await User.findAll({ 
      attributes: ['id', 'name', 'email', 'role'] 
    });
    
    console.log('📋 All Users:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Find all admin users
    const adminUsers = users.filter(user => user.role === 'ADMIN');
    console.log(`\n👑 Found ${adminUsers.length} admin users`);
    
    if (adminUsers.length > 1) {
      console.log('🧹 Cleaning up multiple admins...');
      
      // Keep only the first admin, make others USER
      const mainAdmin = adminUsers[0];
      const otherAdmins = adminUsers.slice(1);
      
      console.log(`✅ Keeping: ${mainAdmin.name} (${mainAdmin.email}) as ADMIN`);
      
      for (const admin of otherAdmins) {
        await User.update(
          { role: 'USER' },
          { where: { id: admin.id } }
        );
        console.log(`🔄 Changed: ${admin.name} (${admin.email}) from ADMIN to USER`);
      }
      
      console.log('✅ Cleanup complete! Only one admin remains.');
    } else if (adminUsers.length === 1) {
      console.log('✅ Only one admin exists - no cleanup needed.');
    } else {
      console.log('❌ No admin users found!');
    }
    
    // Show final user list
    const finalUsers = await User.findAll({ 
      attributes: ['id', 'name', 'email', 'role'] 
    });
    
    console.log('\n📋 Final User List:');
    finalUsers.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    
    // Count admins
    const finalAdmins = finalUsers.filter(user => user.role === 'ADMIN');
    console.log(`\n👑 Final Admin Count: ${finalAdmins.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanAdminUsers();

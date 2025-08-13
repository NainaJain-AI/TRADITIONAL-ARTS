const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const fixAllUserPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const allUsers = await User.find({});
    console.log(`\n📊 Found ${allUsers.length} users in database`);
    
    console.log('\n🔧 Updating all user passwords to meet 12-character requirement...\n');
    
    const updatedUsers = [];
    
    for (const user of allUsers) {
      // Generate a 12+ character password based on the user's name/email
      const baseName = user.name.toLowerCase().replace(/\s+/g, '');
      const baseEmail = user.email.split('@')[0];
      
      // Create a secure password that's easy to remember: [name/email]123456789
      let newPassword;
      if (baseName.length > 0) {
        newPassword = `${baseName}123456789`;
      } else {
        newPassword = `${baseEmail}123456789`;
      }
      
      // Ensure password is at least 12 characters
      if (newPassword.length < 12) {
        newPassword = newPassword + '123456789'.substring(0, 12 - newPassword.length);
      }
      
      // Update the user's password
      user.password = newPassword;
      await user.save();
      
      updatedUsers.push({
        name: user.name,
        email: user.email,
        role: user.role,
        newPassword: newPassword
      });
      
      console.log(`✅ Updated: ${user.name} (${user.email}) -> Password: ${newPassword}`);
    }
    
    console.log(`\n🎉 Successfully updated ${updatedUsers.length} user passwords!`);
    
    // Create a credentials file
    const credentialsContent = `# 🔐 Updated User Credentials\n\nAll user passwords have been updated to meet the 12-character minimum requirement.\n\n## Login Credentials\n\n`;
    
    let credentialsText = credentialsContent;
    
    updatedUsers.forEach((user, index) => {
      credentialsText += `### ${index + 1}. ${user.name}\n`;
      credentialsText += `- **Email:** ${user.email}\n`;
      credentialsText += `- **Password:** ${user.newPassword}\n`;
      credentialsText += `- **Role:** ${user.role}\n\n`;
    });
    
    credentialsText += `\n## Notes\n- All passwords follow the pattern: [username]123456789\n- Minimum 12 characters as required by server validation\n- All users have email verification status preserved\n\nGenerated on: ${new Date().toISOString()}\n`;
    
    // Write credentials to file
    const fs = require('fs');
    fs.writeFileSync('ALL_USER_CREDENTIALS.md', credentialsText);
    
    console.log('\n📝 Complete credentials list saved to: ALL_USER_CREDENTIALS.md');
    
    // Test a few logins to verify they work
    console.log('\n🧪 Testing a few updated credentials...');
    
    // Test first 3 users
    const testUsers = updatedUsers.slice(0, 3);
    for (const testUser of testUsers) {
      try {
        // Find user again to test password comparison
        const userDoc = await User.findOne({ email: testUser.email });
        const isMatch = await userDoc.comparePassword(testUser.newPassword);
        console.log(`🔐 Password test for ${testUser.name}: ${isMatch ? '✅ SUCCESS' : '❌ FAILED'}`);
      } catch (error) {
        console.log(`🔐 Password test for ${testUser.name}: ❌ ERROR - ${error.message}`);
      }
    }
    
    mongoose.connection.close();
    console.log('\n✅ All user passwords have been fixed!');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

fixAllUserPasswords();

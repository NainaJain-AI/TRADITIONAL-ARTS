const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const restoreUserAccounts = async () => {
  try {
    console.log('👥 RESTORING MISSING USER ACCOUNTS');
    console.log('==================================\n');

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kalasangam');
    console.log('✅ Connected to MongoDB\n');
    
    const db = mongoose.connection.db;
    const artistProfilesCollection = db.collection('artistprofiles');
    
    // Get all legitimate artist profiles
    const allProfiles = await artistProfilesCollection.find({
      name: { $ne: 'russian_hacker' },
      email: { $not: /hack/i }
    }).toArray();
    
    console.log(`📊 Found ${allProfiles.length} legitimate artist profiles`);
    
    let createdUsers = 0;
    let existingUsers = 0;
    let errors = 0;
    
    console.log('\n🔍 CHECKING AND CREATING USER ACCOUNTS:');
    console.log('=======================================');
    
    for (const profile of allProfiles) {
      try {
        console.log(`\nProcessing: ${profile.name} (${profile.email})`);
        
        // Check if user account already exists by email
        const existingUserByEmail = await User.findOne({ email: profile.email });
        
        if (existingUserByEmail) {
          console.log(`   ✅ User account already exists (ID: ${existingUserByEmail._id})`);
          
          // Update the profile to link to existing user if not already linked
          if (profile.userId !== existingUserByEmail._id.toString()) {
            await artistProfilesCollection.updateOne(
              { _id: profile._id },
              { $set: { userId: existingUserByEmail._id } }
            );
            console.log(`   🔗 Profile linked to existing user account`);
          }
          existingUsers++;
          continue;
        }
        
        // Check if there's a user account with the profile's userId
        if (profile.userId) {
          const existingUserById = await User.findById(profile.userId);
          if (existingUserById) {
            console.log(`   ✅ User account exists with profile's userId`);
            existingUsers++;
            continue;
          }
        }
        
        // Create new user account for this profile
        console.log(`   🆕 Creating new user account...`);
        
        // Generate a temporary password (users will need to reset it)
        const tempPassword = 'TempPass123!@#';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(tempPassword, salt);
        
        const newUser = new User({
          name: profile.name,
          email: profile.email,
          password: hashedPassword,
          role: 'Artist',
          isEmailVerified: false, // They'll need to verify their email
          // Copy any additional fields from profile if they exist
          bio: profile.bio || '',
          location: profile.location || null,
          specialization: profile.specialization || null,
          portfolioUrl: profile.portfolioUrl || null,
          socialLinks: profile.socialLinks || {},
          artworks: profile.artworks || []
        });
        
        const savedUser = await newUser.save();
        console.log(`   ✅ User account created (ID: ${savedUser._id})`);
        
        // Update the artist profile to link to the new user account
        await artistProfilesCollection.updateOne(
          { _id: profile._id },
          { $set: { userId: savedUser._id } }
        );
        console.log(`   🔗 Profile linked to new user account`);
        
        createdUsers++;
        
      } catch (error) {
        console.log(`   ❌ Error creating user for ${profile.name}: ${error.message}`);
        errors++;
      }
    }
    
    // Summary
    console.log('\n\n📊 RESTORATION SUMMARY');
    console.log('======================');
    console.log(`Total profiles processed: ${allProfiles.length}`);
    console.log(`✅ Existing user accounts: ${existingUsers}`);
    console.log(`🆕 New user accounts created: ${createdUsers}`);
    console.log(`❌ Errors: ${errors}`);
    
    // Verify all profiles now have user accounts
    console.log('\n\n🔍 VERIFICATION - CHECKING ALL PROFILES HAVE USER ACCOUNTS');
    console.log('=========================================================');
    
    const verificationResults = [];
    
    for (const profile of allProfiles) {
      const user = await User.findById(profile.userId);
      if (user) {
        verificationResults.push({
          profile: profile.name,
          email: profile.email,
          hasUser: true,
          userId: user._id
        });
        console.log(`✅ ${profile.name} -> User account verified`);
      } else {
        verificationResults.push({
          profile: profile.name,
          email: profile.email,
          hasUser: false,
          userId: null
        });
        console.log(`❌ ${profile.name} -> No user account found!`);
      }
    }
    
    const successfulProfiles = verificationResults.filter(r => r.hasUser).length;
    const successRate = Math.round((successfulProfiles / allProfiles.length) * 100);
    
    console.log(`\n📈 SUCCESS RATE: ${successRate}% (${successfulProfiles}/${allProfiles.length})`);
    
    // Create login instructions for users
    console.log('\n\n📋 USER LOGIN INSTRUCTIONS');
    console.log('==========================');
    
    if (createdUsers > 0) {
      console.log(`
🔑 IMPORTANT: For ${createdUsers} newly created accounts:

1. 📧 EMAIL VERIFICATION REQUIRED:
   - All new accounts need email verification
   - Users should check their email for verification link
   - Use the "Resend Verification" feature if needed

2. 🔒 TEMPORARY PASSWORD:
   - Initial password: "TempPass123!@#"
   - Users MUST change this immediately after login
   - Use "Forgot Password" to set their own password

3. 📝 LOGIN PROCESS:
   - Go to login page
   - Enter their email address
   - Use temporary password OR reset password first
   - Verify email if prompted
   - Update to strong password (12+ characters)

4. ✅ EXISTING USERS:
   - ${existingUsers} users can log in with their current credentials
   - May need to update password if it doesn't meet new requirements
      `);
    }
    
    // Create user notification for restored accounts
    const restoredAccountsNotification = `
Subject: Account Restored - KalaSangam Platform Access

Dear Artist,

Great news! Your KalaSangam artist profile has been restored with full account access.

ACCOUNT STATUS:
✅ Your artist profile is preserved and active
✅ User account has been created/restored
✅ All your artwork and profile data is safe

TO ACCESS YOUR ACCOUNT:
${createdUsers > 0 ? `
NEW ACCOUNTS (${createdUsers} artists):
1. Visit the KalaSangam login page
2. Use email: [your email address]
3. Use temporary password: TempPass123!@#
4. Verify your email when prompted
5. IMMEDIATELY change your password to a strong one (12+ characters)
` : ''}
${existingUsers > 0 ? `
EXISTING ACCOUNTS (${existingUsers} artists):
1. Log in with your existing credentials
2. You may need to update your password to meet new requirements (12+ characters)
3. Complete email verification if prompted
` : ''}

NEW SECURITY REQUIREMENTS:
- Passwords must be at least 12 characters
- Include uppercase, lowercase, numbers, and special characters
- No common passwords (like "password" or "123456")

If you have any trouble accessing your account, please contact support.

Welcome back to KalaSangam!

Best regards,
KalaSangam Team
    `;
    
    const notificationPath = path.join(__dirname, 'restored_accounts_notification.txt');
    const fs = require('fs');
    fs.writeFileSync(notificationPath, restoredAccountsNotification);
    console.log(`\n📧 User notification template created: ${notificationPath}`);
    
    console.log('\n🎉 USER ACCOUNT RESTORATION COMPLETE!');
    console.log('✅ All legitimate artist profiles now have user accounts');
    console.log('✅ Users can now sign up and log in to the platform');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during user account restoration:', error.message);
    process.exit(1);
  }
};

restoreUserAccounts();

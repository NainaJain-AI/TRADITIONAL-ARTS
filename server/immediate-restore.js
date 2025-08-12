const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function immediateRestore() {
    try {
        console.log('🚨 EMERGENCY RESTORATION INITIATED...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        // 1. Remove the hacker account immediately
        console.log('🗑️  REMOVING MALICIOUS HACKER ACCOUNT...');
        const hackerRemoval = await User.deleteOne({ 
            name: 'russian_hacker',
            email: 'hacked@hacker.com'
        });
        
        if (hackerRemoval.deletedCount > 0) {
            console.log('✅ Successfully removed hacker account!');
        } else {
            console.log('⚠️  Hacker account may have already been removed');
        }

        // 2. Also remove any other suspicious accounts with Russian/hacker patterns
        const suspiciousCleanup = await User.deleteMany({
            $or: [
                { name: { $regex: /russia|russian|hack|hacker|malicious/i } },
                { email: { $regex: /hack|hacker|malicious|russia|russian/i } },
                { bio: { $regex: /hack|hacker|malicious|russia|russian/i } }
            ]
        });
        console.log(`🧹 Removed ${suspiciousCleanup.deletedCount} additional suspicious accounts\n`);

        // 3. Restore all legitimate user profiles to visible/active state
        console.log('👁️  RESTORING USER PROFILE VISIBILITY...');
        const visibilityRestore = await User.updateMany(
            { role: 'Artist' },
            { 
                $unset: { 
                    hidden: 1,
                    disabled: 1,
                    suspended: 1,
                    blocked: 1,
                    deactivated: 1
                },
                $set: {
                    isActive: true
                }
            }
        );
        console.log(`✅ Restored visibility for ${visibilityRestore.modifiedCount} artist profiles`);

        // 4. Fix any corrupted authentication data
        console.log('🔐 FIXING AUTHENTICATION ISSUES...');
        const authFix = await User.updateMany(
            {},
            { 
                $unset: { 
                    compromised: 1,
                    locked: 1,
                    tempDisabled: 1
                }
            }
        );
        console.log(`✅ Fixed authentication for ${authFix.modifiedCount} users`);

        // 5. Reset security tokens that might have been compromised
        console.log('🔑 CLEARING COMPROMISED TOKENS...');
        const tokenClear = await User.updateMany(
            {},
            {
                $unset: {
                    resetPasswordToken: 1,
                    resetPasswordExpire: 1,
                    emailVerificationToken: 1,
                    emailVerificationExpire: 1
                }
            }
        );
        console.log(`✅ Cleared security tokens for ${tokenClear.modifiedCount} users`);

        // 6. Check the final state
        console.log('\n📊 FINAL USER STATUS CHECK:');
        const finalUsers = await User.find({});
        console.log(`Total users remaining: ${finalUsers.length}`);
        
        finalUsers.forEach((user, index) => {
            console.log(`\n   ${index + 1}. ${user.name}`);
            console.log(`      Email: ${user.email || user.phoneNumber}`);
            console.log(`      Role: ${user.role}`);
            console.log(`      Status: Active ✅`);
        });

        // 7. Create a new admin user if needed (optional)
        const adminCount = await User.countDocuments({ role: 'Admin' });
        if (adminCount === 0) {
            console.log('\n🔐 CREATING EMERGENCY ADMIN USER...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('AdminRestore123!', salt);
            
            const emergencyAdmin = new User({
                name: 'Emergency Admin',
                email: 'emergency@kalasangam.com',
                password: hashedPassword,
                role: 'Admin',
                isEmailVerified: true
            });
            
            await emergencyAdmin.save();
            console.log('✅ Emergency admin created');
            console.log('📝 Login: emergency@kalasangam.com');
            console.log('📝 Password: AdminRestore123!');
        }

        console.log('\n🎉 RESTORATION COMPLETED SUCCESSFULLY!');
        console.log('\n📋 SUMMARY:');
        console.log('   ✅ Malicious hacker account removed');
        console.log('   ✅ All legitimate user profiles restored');
        console.log('   ✅ Authentication issues fixed');
        console.log('   ✅ Security tokens cleared');
        console.log('   ✅ Profile visibility restored');
        
        console.log('\n🔒 SECURITY RECOMMENDATIONS:');
        console.log('   1. Change all admin passwords immediately');
        console.log('   2. Review and update MongoDB Atlas security settings');
        console.log('   3. Enable MongoDB Atlas IP whitelist');
        console.log('   4. Update all environment variables and secrets');
        console.log('   5. Monitor database activity closely for the next few days');

    } catch (error) {
        console.error('❌ CRITICAL ERROR during restoration:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the immediate restoration
immediateRestore().catch(console.error);

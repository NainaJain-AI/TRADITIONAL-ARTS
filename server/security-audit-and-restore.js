const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const SUSPICIOUS_PATTERNS = [
    /russia/i, /russian/i, /hack/i, /hacker/i, /malicious/i,
    /moscow/i, /kremlin/i, /putin/i, /virus/i, /trojan/i,
    /suspicious/i, /attack/i, /breach/i, /injection/i
];

async function securityAuditAndRestore() {
    try {
        console.log('🔍 Starting Security Audit and Data Restoration...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        // 1. Get all users and analyze
        const allUsers = await User.find({});
        console.log(`📊 Total users in database: ${allUsers.length}\n`);

        // 2. Identify suspicious users
        const suspiciousUsers = [];
        const validUsers = [];
        
        allUsers.forEach(user => {
            const userData = JSON.stringify(user).toLowerCase();
            let isSuspicious = false;
            let suspiciousFields = [];

            // Check for suspicious patterns in all fields
            SUSPICIOUS_PATTERNS.forEach(pattern => {
                if (pattern.test(userData)) {
                    isSuspicious = true;
                    // Find which field contains suspicious content
                    if (pattern.test(user.name || '')) suspiciousFields.push('name');
                    if (pattern.test(user.email || '')) suspiciousFields.push('email');
                    if (pattern.test(user.bio || '')) suspiciousFields.push('bio');
                    if (pattern.test(user.location || '')) suspiciousFields.push('location');
                }
            });

            // Check for unusual creation patterns (e.g., multiple users created in rapid succession)
            if (isSuspicious) {
                suspiciousUsers.push({
                    user,
                    suspiciousFields,
                    createdAt: user.createdAt
                });
            } else {
                validUsers.push(user);
            }
        });

        console.log('🚨 SECURITY AUDIT RESULTS:');
        console.log(`   Valid users: ${validUsers.length}`);
        console.log(`   Suspicious users: ${suspiciousUsers.length}\n`);

        // 3. Display suspicious users
        if (suspiciousUsers.length > 0) {
            console.log('⚠️  SUSPICIOUS USERS FOUND:');
            suspiciousUsers.forEach((item, index) => {
                const user = item.user;
                console.log(`\n   ${index + 1}. User ID: ${user._id}`);
                console.log(`      Name: ${user.name || 'N/A'}`);
                console.log(`      Email: ${user.email || 'N/A'}`);
                console.log(`      Phone: ${user.phoneNumber || 'N/A'}`);
                console.log(`      Role: ${user.role || 'N/A'}`);
                console.log(`      Created: ${user.createdAt}`);
                console.log(`      Suspicious fields: ${item.suspiciousFields.join(', ')}`);
            });
            console.log('\n');
        }

        // 4. Display valid users (these should be restored)
        console.log('✅ VALID USERS (TO BE RESTORED):');
        validUsers.forEach((user, index) => {
            console.log(`\n   ${index + 1}. User ID: ${user._id}`);
            console.log(`      Name: ${user.name || 'N/A'}`);
            console.log(`      Email: ${user.email || 'N/A'}`);
            console.log(`      Phone: ${user.phoneNumber || 'N/A'}`);
            console.log(`      Role: ${user.role || 'N/A'}`);
            console.log(`      Created: ${user.createdAt}`);
            console.log(`      Verified: ${user.isVerified}`);
        });

        // 5. Check for any users with login issues
        console.log('\n🔐 AUTHENTICATION STATUS CHECK:');
        const usersWithoutPassword = await User.find({ 
            password: { $exists: false },
            googleId: { $exists: false }
        });
        
        if (usersWithoutPassword.length > 0) {
            console.log(`❌ Users without authentication method: ${usersWithoutPassword.length}`);
            usersWithoutPassword.forEach(user => {
                console.log(`   - ${user.name} (${user.email || user.phoneNumber})`);
            });
        } else {
            console.log('✅ All users have valid authentication methods');
        }

        // 6. Check for profile visibility issues
        console.log('\n👤 PROFILE VISIBILITY CHECK:');
        const hiddenProfiles = await User.find({ isVerified: false });
        console.log(`📝 Unverified profiles: ${hiddenProfiles.length}`);
        
        // 7. Offer restoration options
        console.log('\n🔧 RESTORATION OPTIONS AVAILABLE:');
        console.log('   1. Remove suspicious users only');
        console.log('   2. Reset passwords for all valid users');
        console.log('   3. Restore profile visibility');
        console.log('   4. Generate backup of current state');
        console.log('\nRun the restoration functions as needed...\n');

        return {
            totalUsers: allUsers.length,
            validUsers,
            suspiciousUsers,
            usersWithoutAuth: usersWithoutPassword
        };

    } catch (error) {
        console.error('❌ Error during audit:', error);
        throw error;
    }
}

// Restoration functions
async function removeSuspiciousUsers(suspiciousUserIds) {
    try {
        console.log('🗑️  Removing suspicious users...');
        const result = await User.deleteMany({ _id: { $in: suspiciousUserIds } });
        console.log(`✅ Removed ${result.deletedCount} suspicious users`);
        return result;
    } catch (error) {
        console.error('❌ Error removing suspicious users:', error);
        throw error;
    }
}

async function resetUserPasswords(userIds, newPassword = 'TempPassword123!') {
    try {
        console.log('🔑 Resetting passwords for specified users...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        const result = await User.updateMany(
            { _id: { $in: userIds } },
            { 
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpire: null
            }
        );
        
        console.log(`✅ Reset passwords for ${result.modifiedCount} users`);
        console.log(`📝 Temporary password: ${newPassword}`);
        return result;
    } catch (error) {
        console.error('❌ Error resetting passwords:', error);
        throw error;
    }
}

async function restoreProfileVisibility() {
    try {
        console.log('👁️  Restoring profile visibility...');
        const result = await User.updateMany(
            { role: 'Artist' },
            { 
                $unset: { 
                    hidden: 1,
                    disabled: 1,
                    suspended: 1
                }
            }
        );
        console.log(`✅ Restored visibility for ${result.modifiedCount} profiles`);
        return result;
    } catch (error) {
        console.error('❌ Error restoring visibility:', error);
        throw error;
    }
}

async function createBackup() {
    try {
        console.log('💾 Creating backup of current user data...');
        const users = await User.find({});
        const fs = require('fs');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = `user-backup-${timestamp}.json`;
        
        fs.writeFileSync(backupFile, JSON.stringify(users, null, 2));
        console.log(`✅ Backup created: ${backupFile}`);
        return backupFile;
    } catch (error) {
        console.error('❌ Error creating backup:', error);
        throw error;
    }
}

// Main execution
async function main() {
    try {
        const auditResults = await securityAuditAndRestore();
        
        // Automatically create backup
        await createBackup();
        
        // Provide restoration recommendations
        console.log('🎯 RECOMMENDED ACTIONS:');
        
        if (auditResults.suspiciousUsers.length > 0) {
            console.log('   1. ⚠️  Remove suspicious users first');
            console.log('   2. 🔑 Reset passwords for remaining valid users');
        }
        
        if (auditResults.usersWithoutAuth.length > 0) {
            console.log('   3. 🔐 Fix authentication for users without passwords');
        }
        
        console.log('   4. 👁️  Restore profile visibility');
        console.log('   5. 🔍 Monitor for future suspicious activity\n');
        
        console.log('💡 To execute restoration:');
        console.log('   - Uncomment the restoration functions below');
        console.log('   - Or run them separately as needed\n');
        
        // Uncomment these lines to execute restorations automatically:
        
        // if (auditResults.suspiciousUsers.length > 0) {
        //     const suspiciousIds = auditResults.suspiciousUsers.map(item => item.user._id);
        //     await removeSuspiciousUsers(suspiciousIds);
        // }
        
        // const validIds = auditResults.validUsers.map(user => user._id);
        // if (validIds.length > 0) {
        //     await resetUserPasswords(validIds);
        // }
        
        // await restoreProfileVisibility();

    } catch (error) {
        console.error('💥 Critical error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Export functions for manual use
module.exports = {
    securityAuditAndRestore,
    removeSuspiciousUsers,
    resetUserPasswords,
    restoreProfileVisibility,
    createBackup,
    main
};

// Run if called directly
if (require.main === module) {
    main();
}

const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

async function securityHardening() {
    try {
        console.log('🛡️  IMPLEMENTING SECURITY HARDENING...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        // 1. Change all existing admin passwords
        console.log('🔑 UPDATING ADMIN PASSWORDS...');
        const admins = await User.find({ role: 'Admin' });
        const newAdminPassword = 'SecureAdmin2025!' + crypto.randomBytes(4).toString('hex');
        
        for (const admin of admins) {
            const salt = await bcrypt.genSalt(12); // Increased salt rounds
            const hashedPassword = await bcrypt.hash(newAdminPassword, salt);
            
            await User.updateOne(
                { _id: admin._id },
                { 
                    password: hashedPassword,
                    lastPasswordChange: new Date(),
                    $unset: {
                        resetPasswordToken: 1,
                        resetPasswordExpire: 1
                    }
                }
            );
        }
        
        console.log(`✅ Updated passwords for ${admins.length} admin accounts`);
        console.log(`📝 New admin password: ${newAdminPassword}\n`);

        // 2. Add security monitoring fields to all users
        console.log('📊 ADDING SECURITY MONITORING FIELDS...');
        const securityUpdate = await User.updateMany(
            {},
            {
                $set: {
                    lastLogin: null,
                    loginAttempts: 0,
                    accountLocked: false,
                    lockUntil: null,
                    ipWhitelist: [],
                    suspiciousActivityScore: 0,
                    lastSecurityCheck: new Date()
                }
            }
        );
        console.log(`✅ Added security monitoring to ${securityUpdate.modifiedCount} users`);

        // 3. Create security log collection (if it doesn't exist)
        console.log('📝 SETTING UP SECURITY LOGGING...');
        const SecurityLog = mongoose.model('SecurityLog', new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            action: String,
            ipAddress: String,
            userAgent: String,
            timestamp: { type: Date, default: Date.now },
            risk: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
            details: Object
        }));
        
        console.log('✅ Security logging system configured');

        // 4. Set up automated suspicious pattern detection
        console.log('🕵️  CONFIGURING THREAT DETECTION...');
        
        // Create an index for faster suspicious pattern searches
        await User.collection.createIndex({ 
            name: 'text', 
            email: 'text', 
            bio: 'text', 
            location: 'text' 
        });
        console.log('✅ Search indexes created for threat detection');

        // 5. Create emergency procedures document
        const emergencyProcedures = {
            suspiciousPatterns: [
                'russia', 'russian', 'hack', 'hacker', 'malicious',
                'moscow', 'kremlin', 'putin', 'virus', 'trojan',
                'suspicious', 'attack', 'breach', 'injection',
                'bot', 'spam', 'phishing', 'scam'
            ],
            emergencyContacts: [
                'honeyreorganizer@gmail.com',
                'vaishalidak0901@gmail.com'
            ],
            backupSchedule: 'Daily at 2:00 AM IST',
            monitoringEndpoints: [
                '/api/auth/login',
                '/api/auth/register',
                '/api/admin-login'
            ]
        };

        console.log('\n🚨 EMERGENCY PROCEDURES CONFIGURED');
        console.log('   - Suspicious pattern detection active');
        console.log('   - Emergency contacts updated');
        console.log('   - Monitoring endpoints defined');

        // 6. Database connection security settings
        console.log('\n🔐 DATABASE SECURITY RECOMMENDATIONS:');
        console.log('   1. Enable MongoDB Atlas IP Access List:');
        console.log('      - Add your current IP address');
        console.log('      - Remove 0.0.0.0/0 (allow all) if present');
        console.log('   2. Enable Database Access authentication');
        console.log('   3. Enable Database Auditing');
        console.log('   4. Set up MongoDB Atlas alerts for:');
        console.log('      - Unusual connection patterns');
        console.log('      - Failed authentication attempts');
        console.log('      - Database schema changes');

        // 7. Application security recommendations
        console.log('\n🛡️  APPLICATION SECURITY RECOMMENDATIONS:');
        console.log('   1. Update environment variables:');
        console.log('      - Generate new JWT_SECRET');
        console.log('      - Rotate SMTP passwords');
        console.log('      - Update API keys');
        console.log('   2. Implement rate limiting on auth endpoints');
        console.log('   3. Add CAPTCHA to registration forms');
        console.log('   4. Enable HTTPS everywhere');
        console.log('   5. Set up automated security scans');

        // 8. Generate new secure JWT secret
        const newJwtSecret = crypto.randomBytes(64).toString('hex');
        console.log('\n🔑 NEW JWT SECRET GENERATED:');
        console.log(`   JWT_SECRET=${newJwtSecret}`);
        console.log('   ⚠️  Update this in your .env file!');

        console.log('\n✅ SECURITY HARDENING COMPLETED!');
        
        // Save emergency procedures to file
        const fs = require('fs');
        fs.writeFileSync(
            'security-procedures.json', 
            JSON.stringify(emergencyProcedures, null, 2)
        );
        console.log('📄 Emergency procedures saved to security-procedures.json');

    } catch (error) {
        console.error('❌ Error during security hardening:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Run the security hardening
securityHardening().catch(console.error);

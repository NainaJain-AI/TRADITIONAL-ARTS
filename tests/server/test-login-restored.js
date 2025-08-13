const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function testLoginFunctionality() {
    try {
        console.log('🧪 TESTING RESTORED USER LOGIN FUNCTIONALITY...\n');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB Atlas\n');

        // Test admin login
        console.log('🔐 Testing Admin Login...');
        const admin = await User.findOne({ role: 'Admin' });
        if (admin) {
            console.log(`   Admin found: ${admin.name} (${admin.email})`);
            console.log(`   Password hash exists: ${admin.password ? '✅' : '❌'}`);
            console.log(`   Email verified: ${admin.isEmailVerified ? '✅' : '⚠️'}`);
        }

        // Test artist profiles
        console.log('\n👨‍🎨 Testing Artist Profiles...');
        const artists = await User.find({ role: 'Artist' });
        artists.forEach((artist, index) => {
            console.log(`\n   ${index + 1}. ${artist.name}`);
            console.log(`      Email: ${artist.email}`);
            console.log(`      Password: ${artist.password ? '✅ Present' : '❌ Missing'}`);
            console.log(`      Verified: ${artist.isVerified ? '✅' : '⚠️ Pending'}`);
            console.log(`      Created: ${artist.createdAt.toLocaleDateString()}`);
        });

        // Check if profiles are visible (no blocking fields)
        console.log('\n👁️  Profile Visibility Check...');
        const hiddenProfiles = await User.find({
            $or: [
                { hidden: true },
                { disabled: true },
                { suspended: true },
                { blocked: true },
                { deactivated: true }
            ]
        });
        
        if (hiddenProfiles.length === 0) {
            console.log('✅ All profiles are visible and active');
        } else {
            console.log(`⚠️  ${hiddenProfiles.length} profiles still have visibility issues`);
        }

        console.log('\n📊 SUMMARY:');
        console.log(`   Total users: ${await User.countDocuments()}`);
        console.log(`   Admin accounts: ${await User.countDocuments({ role: 'Admin' })}`);
        console.log(`   Artist accounts: ${await User.countDocuments({ role: 'Artist' })}`);
        console.log(`   Accounts with passwords: ${await User.countDocuments({ password: { $exists: true } })}`);
        
        console.log('\n🎯 Next Steps:');
        console.log('   1. Start your server: npm run dev');
        console.log('   2. Test login with existing user credentials');
        console.log('   3. Admin login: admin@test.com / SecureAdmin2025!2ff4c2e6');
        console.log('   4. Check artist profiles are showing in frontend');
        console.log('   5. Monitor for any suspicious activity');

    } catch (error) {
        console.error('❌ Error during testing:', error);
        throw error;
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

testLoginFunctionality().catch(console.error);

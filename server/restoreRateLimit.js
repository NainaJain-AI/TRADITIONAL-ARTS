const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring original rate limiting configuration...');

try {
  const backupPath = path.join(__dirname, 'middleware', 'rateLimiting.js.backup');
  const currentPath = path.join(__dirname, 'middleware', 'rateLimiting.js');
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, currentPath);
    console.log('✅ Original rate limiting restored successfully');
    console.log('📝 Rate limits restored to:');
    console.log('   - Authentication: 5 requests per 15 minutes');
    console.log('   - Registration: 3 requests per hour');
    console.log('   - Password reset: 3 requests per 15 minutes');
    console.log('\n⚠️  Please restart your server for changes to take effect');
    
    // Clean up backup file
    fs.unlinkSync(backupPath);
    console.log('🧹 Backup file cleaned up');
    
  } else {
    console.log('❌ Backup file not found. Rate limiting may need to be manually restored.');
  }
  
} catch (error) {
  console.error('❌ Error restoring rate limiting:', error.message);
}

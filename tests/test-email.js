const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('📧 Testing email configuration...');
  console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL);
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***hidden***' : 'NOT SET');

  try {
  const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
    });

    console.log('\n🔍 Verifying transporter configuration...');
    await transporter.verify();
    console.log('✅ Transporter configuration is valid');

    console.log('\n📤 Sending test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: process.env.SMTP_EMAIL, // Send to yourself for testing
      subject: 'Test Email from Kala Sangam',
      text: 'This is a test email to verify SMTP configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #134856;">Test Email</h1>
          <p>This is a test email to verify your SMTP configuration for Kala Sangam.</p>
          <p>If you receive this email, your nodemailer setup is working correctly!</p>
          <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Command:', error.command);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication failed. Possible solutions:');
      console.log('1. Make sure you are using an App Password, not your regular Gmail password');
      console.log('2. Enable 2-factor authentication on your Gmail account');
      console.log('3. Generate an App Password: https://myaccount.google.com/apppasswords');
      console.log('4. Use the App Password in your SMTP_PASSWORD environment variable');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection failed. Possible solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Verify Gmail allows less secure apps (not recommended)');
      console.log('3. Try using App Password instead');
    }
  }
}

testEmail();

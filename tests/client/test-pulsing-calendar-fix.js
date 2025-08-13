import axios from 'axios';

const API_URL = 'http://localhost:5050';

async function testPulsingCalendarFix() {
  console.log('🔧 Testing Pulsing Events Calendar Fix\n');
  console.log('=======================================\n');

  try {
    // Test 1: Verify backend is running
    console.log('1. Testing backend connectivity...');
    try {
      const healthResponse = await axios.get(`${API_URL}/api/health`);
      console.log('✅ Backend server is running');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Backend server is NOT running');
        console.log('💡 Start the backend server with: node server.js');
        return;
      }
    }

    // Test 2: Check events in database
    console.log('\n2. Checking events in database...');
    const allEventsResponse = await axios.get(`${API_URL}/api/events?upcoming=false`);
    const upcomingEventsResponse = await axios.get(`${API_URL}/api/events?upcoming=true`);
    
    console.log(`   Total events: ${allEventsResponse.data.data?.length || 0}`);
    console.log(`   Upcoming events: ${upcomingEventsResponse.data.data?.length || 0}`);
    
    if (allEventsResponse.data.data?.length === 0) {
      console.log('❌ No events found in database');
      console.log('💡 Run: node server/data/seedEvents.js to populate events');
      return;
    } else {
      console.log('✅ Events found in database');
    }

    // Test 3: Verify data structure for PulsingEventsCalendar
    console.log('\n3. Verifying event data structure...');
    const sampleEvent = allEventsResponse.data.data[0];
    const requiredFields = ['_id', 'title', 'description', 'type', 'category', 'date', 'time', 'location'];
    const missingFields = requiredFields.filter(field => !sampleEvent[field]);
    
    if (missingFields.length === 0) {
      console.log('✅ All required event fields are present');
    } else {
      console.log('❌ Missing required fields:', missingFields);
      return;
    }

    // Test 4: Verify location structure
    const location = sampleEvent.location;
    if (location?.venue && location?.city && location?.state && location?.address) {
      console.log('✅ Event location structure is correct');
    } else {
      console.log('❌ Event location structure is incomplete');
      console.log('Location data:', location);
      return;
    }

    // Test 5: Check API response format
    console.log('\n4. Verifying API response format...');
    if (allEventsResponse.data.success && Array.isArray(allEventsResponse.data.data)) {
      console.log('✅ API response format is correct');
    } else {
      console.log('❌ API response format is incorrect');
      console.log('Response structure:', Object.keys(allEventsResponse.data));
      return;
    }

    // Test 6: Display sample events for verification
    console.log('\n5. Sample events that will appear in the calendar:');
    allEventsResponse.data.data.slice(0, 3).forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title}`);
      console.log(`      Type: ${event.type} | Category: ${event.category}`);
      console.log(`      Date: ${new Date(event.date).toLocaleDateString()}`);
      console.log(`      Location: ${event.location.city}, ${event.location.state}`);
      console.log('');
    });

    // Test 7: Verify upcoming events for the sidebar
    console.log('6. Upcoming events for sidebar:');
    if (upcomingEventsResponse.data.data?.length > 0) {
      upcomingEventsResponse.data.data.slice(0, 3).forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title} - ${event.location.city}`);
      });
      console.log('✅ Upcoming events are available for sidebar');
    } else {
      console.log('⚠️  No upcoming events found (this is normal if all events are in the past)');
    }

    console.log('\n🎉 SUCCESS: Pulsing Events Calendar should now work correctly!');
    console.log('\n📋 Summary:');
    console.log('   • Backend server is running ✅');
    console.log('   • Events are populated in database ✅');
    console.log('   • Event data structure is correct ✅');
    console.log('   • API endpoints are working ✅');
    console.log('\n🚀 Next steps:');
    console.log('   1. Start the frontend: npm run dev (in client/kala-sangam/)');
    console.log('   2. Navigate to the home page');
    console.log('   3. The Pulsing Events Calendar should display with pulsing icons');
    console.log('   4. Click on any pulsing event to see details');

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testPulsingCalendarFix();

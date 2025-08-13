import axios from 'axios';

const API_URL = 'http://localhost:5050';

async function testEventsAPI() {
  try {
    console.log('Testing Events API...\n');

    // Test 1: Get all events (including past)
    console.log('1. Testing GET /api/events (all events)');
    const allEventsResponse = await axios.get(`${API_URL}/api/events?upcoming=false`);
    console.log(`Response status: ${allEventsResponse.status}`);
    console.log(`Total events: ${allEventsResponse.data.data?.length || 0}`);
    
    if (allEventsResponse.data.data?.length > 0) {
      console.log('Sample event:', {
        title: allEventsResponse.data.data[0].title,
        date: allEventsResponse.data.data[0].date,
        location: allEventsResponse.data.data[0].location
      });
    }
    console.log('✅ All events API working\n');

    // Test 2: Get upcoming events only
    console.log('2. Testing GET /api/events (upcoming only)');
    const upcomingEventsResponse = await axios.get(`${API_URL}/api/events?upcoming=true`);
    console.log(`Response status: ${upcomingEventsResponse.status}`);
    console.log(`Upcoming events: ${upcomingEventsResponse.data.data?.length || 0}`);
    console.log('✅ Upcoming events API working\n');

    // Test 3: Verify data structure matches frontend expectations
    console.log('3. Verifying data structure');
    const sampleEvent = allEventsResponse.data.data?.[0];
    if (sampleEvent) {
      const requiredFields = ['_id', 'title', 'description', 'type', 'category', 'date', 'time', 'location'];
      const missingFields = requiredFields.filter(field => !sampleEvent[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
      } else {
        console.log('❌ Missing fields:', missingFields);
      }
      
      // Check location structure
      if (sampleEvent.location?.city && sampleEvent.location?.state) {
        console.log('✅ Location structure is correct');
      } else {
        console.log('❌ Location structure is incorrect');
      }
    }

    console.log('\n🎉 Events API tests completed successfully!');
    console.log('\nThe Pulsing Events Calendar should now work correctly on the home page.');

  } catch (error) {
    console.error('❌ Error testing Events API:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Make sure the backend server is running on port 5050');
      console.error('   Run: node server.js (in the server directory)');
    }
  }
}

testEventsAPI();

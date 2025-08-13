import React, { useState } from 'react';

const SearchTest = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Search Component Test</h2>
      
      {/* Test basic dropdown visibility */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Click to test dropdown visibility"
          className="w-full p-3 border border-gray-300 rounded-lg"
          onFocus={() => setIsVisible(true)}
          onBlur={() => setTimeout(() => setIsVisible(false), 200)}
        />
        
        {isVisible && (
          <div 
            className="absolute top-full mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg p-4"
            style={{ zIndex: 9999 }}
          >
            <div className="text-sm text-gray-700">
              ✅ Dropdown is visible!
            </div>
            <div className="mt-2">
              <button 
                className="w-full text-left p-2 hover:bg-gray-100 rounded"
                onClick={() => console.log('Test button clicked!')}
              >
                Test suggestion 1
              </button>
              <button 
                className="w-full text-left p-2 hover:bg-gray-100 rounded"
                onClick={() => console.log('Test button clicked!')}
              >
                Test suggestion 2
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Test API connection */}
      <button
        onClick={async () => {
          try {
            console.log('🔧 Testing API connection...');
            const response = await fetch('http://localhost:5050/api/smart-search/suggestions?query=test');
            console.log('🔧 Response status:', response.status);
            const data = await response.json();
            console.log('🔧 Response data:', data);
            alert(`API Test: ${response.status} - Check console for details`);
          } catch (error) {
            console.error('🔧 API test failed:', error);
            alert(`API Error: ${error.message}`);
          }
        }}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Test API Connection
      </button>
    </div>
  );
};

export default SearchTest;

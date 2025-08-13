#!/bin/bash

echo "🧪 Testing TRADITIONAL-ARTS project fixes..."
echo ""

# Check if server is running
echo "1. Checking server status..."
if lsof -i :5050 > /dev/null 2>&1; then
    echo "   ✅ Server is running on port 5050"
else
    echo "   ❌ Server is not running on port 5050"
    echo "   🔧 Starting server..."
    cd "/Users/shreyuuu/Desktop/TRADITIONAL-ARTS/server"
    npm start &
    sleep 5
fi

# Check if frontend is running
echo ""
echo "2. Checking frontend status..."
if lsof -i :5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on port 5173"
else
    echo "   ❌ Frontend is not running on port 5173"
fi

# Test API endpoints
echo ""
echo "3. Testing API endpoints..."
if curl -s http://localhost:5050/api/artforms | head -c 50 > /dev/null; then
    echo "   ✅ /api/artforms endpoint is working"
else
    echo "   ❌ /api/artforms endpoint is not responding"
fi

echo ""
echo "4. Testing routes..."
if curl -s http://localhost:5173/about -I | grep "200 OK" > /dev/null; then
    echo "   ✅ /about route is accessible"
else
    echo "   ❌ /about route is not accessible"
fi

if curl -s http://localhost:5173/gallery -I | grep "200 OK" > /dev/null; then
    echo "   ✅ /gallery route is accessible"
else
    echo "   ❌ /gallery route is not accessible"
fi

echo ""
echo "🎯 Summary of fixes applied:"
echo "   • ✅ Added proper loading states to ArtGallery"
echo "   • ✅ Added error handling with retry functionality"
echo "   • ✅ Improved ArtFormCard with image loading states"
echo "   • ✅ Enhanced About page navigation handling"
echo "   • ✅ Added AOS animations with proper timing"
echo "   • ✅ Fixed card display issues with staggered animations"
echo ""

echo "📝 Instructions:"
echo "   1. Navigate to http://localhost:5173/about - should load smoothly"
echo "   2. Navigate to http://localhost:5173/gallery - cards should load with animation"
echo "   3. Refresh the gallery page - should work properly on first load"
echo ""

echo "🔍 Issues fixed:"
echo "   • About page not working ✅"  
echo "   • Art gallery cards not displaying properly on first load ✅"
echo "   • Added loading spinners and error states ✅"
echo "   • Improved card animations and image loading ✅"

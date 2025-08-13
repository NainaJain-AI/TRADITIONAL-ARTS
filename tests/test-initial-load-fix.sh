#!/bin/bash

echo "🧪 Testing Initial Load Layout Fixes"
echo "=================================="

# Check if servers are running
echo "1. Checking server status..."

# Check backend server
if curl -s http://localhost:5050/api/artforms > /dev/null; then
    echo "✅ Backend server (port 5050) is running"
else
    echo "❌ Backend server not running - please start with: cd server && npm start"
    exit 1
fi

# Check frontend server
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend server (port 5173) is running"
else
    echo "❌ Frontend server not running - please start with: cd client/kala-sangam && npm run dev"
    exit 1
fi

echo ""
echo "2. Checking API endpoints..."

# Test art forms API
artforms_count=$(curl -s http://localhost:5050/api/artforms | jq length 2>/dev/null)
if [ "$artforms_count" -gt 100 ]; then
    echo "✅ API returning $artforms_count artforms"
else
    echo "⚠️  API may have issues - got $artforms_count artforms"
fi

echo ""
echo "3. Testing key files exist..."

# Check if key files exist
files=(
    "client/kala-sangam/src/context/AppReadyContext.jsx"
    "client/kala-sangam/src/App.jsx"
    "client/kala-sangam/src/pages/ArtGallery.jsx"
    "client/kala-sangam/src/pages/About.jsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "4. Manual Testing Instructions:"
echo "==============================="
echo "Please test the following scenarios manually in your browser:"
echo ""
echo "🌐 Open: http://localhost:5173"
echo ""
echo "Test 1: Art Gallery Initial Load"
echo "  1. Navigate to Gallery page (click Gallery in header)"
echo "  2. ✅ Should show proper layout immediately (no refresh needed)"
echo "  3. ✅ Cards should appear with smooth animation"
echo "  4. ✅ No console errors about duplicate keys"
echo ""
echo "Test 2: About Page Initial Load"
echo "  1. Navigate to About page (click About in header)"
echo "  2. ✅ Should show proper layout immediately (no refresh needed)"
echo "  3. ✅ Animations should initialize correctly"
echo "  4. ✅ Page should look complete on first load"
echo ""
echo "Test 3: Page Refresh Consistency"
echo "  1. On any page, press F5 to refresh"
echo "  2. ✅ Layout should be identical to first load"
echo "  3. ✅ No layout jumps or shifts"
echo ""
echo "Test 4: Navigation Between Pages"
echo "  1. Navigate between Home → Gallery → About → Home"
echo "  2. ✅ Each page should load correctly every time"
echo "  3. ✅ Smooth transitions and no layout issues"
echo ""
echo "Expected Results:"
echo "- ✅ No more initial load layout issues"
echo "- ✅ Consistent appearance on first load vs refresh"
echo "- ✅ Smooth animations and proper loading states"
echo "- ✅ No console errors or warnings"
echo ""
echo "If any test fails, please report the specific issue!"

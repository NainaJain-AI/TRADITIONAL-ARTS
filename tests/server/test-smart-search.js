const smartSearchService = require('./utils/smartSearchService');

async function testSmartSearch() {
  console.log('🔍 Testing AI Smart Search Service...\n');

  // Test 1: Query Analysis
  console.log('1. Query Analysis:');
  const queries = [
    'show me beautiful dance art',
    'find bharatanatyam paintings',
    'i want to see traditional crafts from kerala',
    'search for spiritual music',
    'what is madhubani painting'
  ];

  queries.forEach(query => {
    const analysis = smartSearchService.analyzeQuery(query);
    console.log(`Query: "${query}"`);
    console.log(`  Intent: ${analysis.intent}`);
    console.log(`  Keywords: [${analysis.keywords.join(', ')}]`);
    console.log(`  Categories: [${analysis.categories.join(', ')}]`);
    console.log(`  Confidence: ${analysis.confidence.toFixed(2)}`);
    console.log('');
  });

  // Test 2: Search Suggestions
  console.log('2. Search Suggestions:');
  const partialQueries = ['dance', 'paint', 'classical', 'trad'];
  
  partialQueries.forEach(query => {
    const suggestions = smartSearchService.generateSuggestions(query);
    console.log(`"${query}" → [${suggestions.slice(0, 5).join(', ')}]`);
  });
  console.log('');

  // Test 3: Query Building
  console.log('3. MongoDB Query Building:');
  const testQuery = 'beautiful traditional dance from south india';
  const analysis = smartSearchService.analyzeQuery(testQuery);
  const mongoQuery = smartSearchService.buildSearchQuery(analysis, 'artworks');
  
  console.log(`Query: "${testQuery}"`);
  console.log('Generated MongoDB Query:');
  console.log(JSON.stringify(mongoQuery, null, 2));
  console.log('');

  // Test 4: Relevance Scoring
  console.log('4. Relevance Scoring:');
  const mockArtwork = {
    title: 'Classical Bharatanatyam Dance Performance',
    description: 'A beautiful traditional dance performance showcasing South Indian culture',
    artform: 'Bharatanatyam',
    category: 'Dance',
    tags: ['dance', 'traditional', 'classical', 'south indian'],
    likes: ['user1', 'user2', 'user3'],
    bookmarks: ['user1', 'user4'],
    titleTranslations: {
      hi: 'पारंपरिक भरतनाट्यम नृत्य प्रदर्शन',
      ta: 'பாரம்பரிய பரதநாட்டிய நடன நிகழ்ச்சி'
    }
  };

  const searchAnalysis = smartSearchService.analyzeQuery('traditional dance performance');
  const relevanceScore = smartSearchService.calculateRelevanceScore(mockArtwork, searchAnalysis);
  
  console.log('Mock Artwork:', mockArtwork.title);
  console.log('Search Query: "traditional dance performance"');
  console.log(`Relevance Score: ${relevanceScore.toFixed(3)}`);
  console.log('');

  // Test 5: Search Insights
  console.log('5. Search Insights:');
  const mockResults = [
    { ...mockArtwork, relevanceScore: 0.85 },
    { title: 'Modern Art Gallery', relevanceScore: 0.12 },
    { title: 'Folk Dance Workshop', relevanceScore: 0.67 }
  ];

  const insights = smartSearchService.generateSearchInsights(searchAnalysis, mockResults);
  console.log('Search Insights:');
  console.log(JSON.stringify(insights, null, 2));

  console.log('\n✅ Smart Search Service test completed!');
}

// Run the test
testSmartSearch().catch(console.error);

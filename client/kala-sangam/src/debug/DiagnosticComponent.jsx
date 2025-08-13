import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const DiagnosticComponent = () => {
  const { user, isAuthenticated } = useAuth();
  const [apiUser, setApiUser] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [diagnostics, setDiagnostics] = useState({});

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 Running Frontend Diagnostics...');
      
      const results = {
        timestamp: new Date().toISOString(),
        authContextUser: user,
        isAuthenticated: isAuthenticated,
        localStorage: {
          token: localStorage.getItem('token'),
          user: localStorage.getItem('user')
        }
      };

      // Test API calls
      if (isAuthenticated) {
        try {
          // Get current user from API
          const userResponse = await api.getCurrentUser();
          results.apiUserResponse = userResponse;
          setApiUser(userResponse.user);

          // Get artworks from API
          const artworksResponse = await api.getArtworks({ limit: 50 });
          results.artworksResponse = {
            success: artworksResponse.success,
            count: artworksResponse.data?.length,
            firstFewArtworks: artworksResponse.data?.slice(0, 3).map(art => ({
              id: art._id || art.id,
              title: art.title,
              likes: art.likes,
              bookmarks: art.bookmarks,
              likeCount: art.likeCount,
              bookmarkCount: art.bookmarkCount
            }))
          };
          setArtworks(artworksResponse.data || []);

          // Find the test artwork
          const testArtwork = artworksResponse.data?.find(art => art.title === 'Jagannath Rath Yatra');
          if (testArtwork) {
            results.testArtwork = {
              id: testArtwork._id || testArtwork.id,
              title: testArtwork.title,
              likes: testArtwork.likes,
              bookmarks: testArtwork.bookmarks,
              rawData: testArtwork
            };
          }

        } catch (apiError) {
          results.apiError = apiError.message;
          console.error('API Error:', apiError);
        }
      }

      setDiagnostics(results);
      console.log('🔍 Diagnostics Results:', results);
    };

    runDiagnostics();
  }, [user, isAuthenticated]);

  // Check if user likes match artwork
  const checkLikesConsistency = () => {
    if (!user || !artworks.length) return null;

    const userLikes = user.likes || [];
    const testArtwork = artworks.find(art => art.title === 'Jagannath Rath Yatra');
    
    if (!testArtwork) return null;

    const artworkId = testArtwork._id || testArtwork.id;
    const userHasLiked = userLikes.some(likeId => likeId.toString() === artworkId.toString());
    
    return {
      artworkId: artworkId.toString(),
      userLikes: userLikes.map(id => id.toString()),
      userHasLiked,
      artworkLikeCount: testArtwork.likes,
      expected: userHasLiked ? '❤️ LIKED' : '🤍 NOT LIKED'
    };
  };

  const likesConsistency = checkLikesConsistency();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '400px', 
      maxHeight: '80vh',
      overflow: 'auto',
      background: 'rgba(0,0,0,0.9)', 
      color: 'white', 
      padding: '20px', 
      borderRadius: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999
    }}>
      <h3>🔍 Frontend Diagnostics</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Auth State:</strong>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>Context User ID: {user?.id || 'None'}</div>
        <div>Context User Likes: {JSON.stringify(user?.likes || [])}</div>
      </div>

      {apiUser && (
        <div style={{ marginBottom: '10px' }}>
          <strong>API User:</strong>
          <div>API User ID: {apiUser.id}</div>
          <div>API User Likes: {JSON.stringify(apiUser.likes || [])}</div>
          <div>API User Bookmarks: {JSON.stringify(apiUser.bookmarks || [])}</div>
        </div>
      )}

      {likesConsistency && (
        <div style={{ marginBottom: '10px' }}>
          <strong>Likes Consistency Check:</strong>
          <div>Test Artwork ID: {likesConsistency.artworkId}</div>
          <div>User Likes Array: [{likesConsistency.userLikes.join(', ')}]</div>
          <div>User Has Liked: {likesConsistency.userHasLiked ? '✅' : '❌'}</div>
          <div>Artwork Like Count: {likesConsistency.artworkLikeCount}</div>
          <div>Expected Display: {likesConsistency.expected}</div>
        </div>
      )}

      <div style={{ marginBottom: '10px' }}>
        <strong>Artworks Count:</strong> {artworks.length}
      </div>

      {diagnostics.testArtwork && (
        <div>
          <strong>Test Artwork "Jagannath Rath Yatra":</strong>
          <div>Likes: {diagnostics.testArtwork.likes}</div>
          <div>Bookmarks: {diagnostics.testArtwork.bookmarks}</div>
        </div>
      )}

      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          marginTop: '10px', 
          padding: '5px 10px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        🔄 Reload Page
      </button>
    </div>
  );
};

export default DiagnosticComponent;

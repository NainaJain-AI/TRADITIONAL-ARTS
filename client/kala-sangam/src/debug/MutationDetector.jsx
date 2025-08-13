import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const MutationDetector = ({ artworks = [] }) => {
  const { user } = useAuth();
  const [mutations, setMutations] = useState([]);
  const [artworkSnapshots, setArtworkSnapshots] = useState({});

  useEffect(() => {
    // Take snapshots of artworks to detect mutations
    const newSnapshots = {};
    artworks.forEach(artwork => {
      if (artwork && artwork.id) {
        newSnapshots[artwork.id] = {
          likes: artwork.likes,
          bookmarks: artwork.bookmarks,
          likeCount: artwork.likeCount,
          bookmarkCount: artwork.bookmarkCount,
          timestamp: Date.now()
        };

        // Check for mutations compared to previous snapshot
        const prevSnapshot = artworkSnapshots[artwork.id];
        if (prevSnapshot) {
          const likesChanged = prevSnapshot.likes !== artwork.likes;
          const bookmarksChanged = prevSnapshot.bookmarks !== artwork.bookmarks;
          
          if (likesChanged || bookmarksChanged) {
            const mutation = {
              artworkId: artwork.id,
              title: artwork.title,
              timestamp: Date.now(),
              changes: {
                likes: likesChanged ? { from: prevSnapshot.likes, to: artwork.likes } : null,
                bookmarks: bookmarksChanged ? { from: prevSnapshot.bookmarks, to: artwork.bookmarks } : null
              }
            };
            
            console.error('🚨 MUTATION DETECTED:', mutation);
            setMutations(prev => [...prev.slice(-4), mutation]); // Keep last 5 mutations
          }
        }
      }
    });
    
    setArtworkSnapshots(newSnapshots);
  }, [artworks]);

  // Monitor user state changes
  useEffect(() => {
    if (user && user.likes) {
      console.log('🔍 MutationDetector - User likes changed:', user.likes.length, 'likes');
    }
  }, [user?.likes]);

  if (mutations.length === 0) {
    return (
      <div className="fixed bottom-4 right-4 bg-green-100 border border-green-300 rounded-lg p-3 text-sm z-50">
        <div className="text-green-800 font-semibold">🔒 State Stable</div>
        <div className="text-green-600">No mutations detected</div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 rounded-lg p-3 text-sm max-w-md z-50">
      <div className="text-red-800 font-semibold mb-2">🚨 Mutations Detected!</div>
      {mutations.slice(-3).map((mutation, index) => (
        <div key={index} className="text-red-700 text-xs mb-1">
          <div className="font-medium">{mutation.title}</div>
          {mutation.changes.likes && (
            <div>Likes: {mutation.changes.likes.from} → {mutation.changes.likes.to}</div>
          )}
          {mutation.changes.bookmarks && (
            <div>Bookmarks: {mutation.changes.bookmarks.from} → {mutation.changes.bookmarks.to}</div>
          )}
          <div className="text-gray-500">{new Date(mutation.timestamp).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
};

export default MutationDetector;

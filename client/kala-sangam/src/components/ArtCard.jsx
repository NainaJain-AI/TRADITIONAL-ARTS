import { motion } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaBookmark, FaRegBookmark, FaFlag } from 'react-icons/fa';
import { showToast } from '../utils/toastUtils';
import LazyImage from './LazyImage';
import ReportModal from './ReportModal';
import { api } from '../services/api';

const ArtCard = ({ artwork, index, currentUser, isBookmarked: initialBookmarked, isLiked: initialLiked, onLike, onBookmark, onImageClick }) => {
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked || false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  
  // STABILIZED: Calculate like state using useMemo to prevent recalculation on every render
  const isLiked = useMemo(() => {
    if (!currentUser || !currentUser.likes || !artwork) return false;
    const artworkIdStr = artwork.id ? artwork.id.toString() : artwork._id?.toString();
    if (!artworkIdStr) return false;
    
    const result = currentUser.likes.some(id => id.toString() === artworkIdStr);
    console.log('🔒 ArtCard STABILIZED isLiked calculation:', { 
      artworkId: artworkIdStr, 
      userLikes: currentUser.likes.length, 
      isLiked: result 
    });
    return result;
  }, [currentUser?.likes, artwork?.id, artwork?._id]);
  
  // STABILIZED: Calculate display counts using useMemo to prevent recalculation
  const displayCounts = useMemo(() => {
    const likeCount = typeof artwork.likes === 'number' ? artwork.likes : 
                     (artwork.likeCount ?? 0);
    const bookmarkCount = typeof artwork.bookmarks === 'number' ? artwork.bookmarks : 
                         (artwork.bookmarkCount ?? 0);
    
    console.log('🔒 ArtCard STABILIZED counts calculation:', { 
      artworkId: artwork.id, 
      likes: artwork.likes, 
      likeCount: artwork.likeCount, 
      bookmarks: artwork.bookmarks,
      bookmarkCount: artwork.bookmarkCount,
      finalLikes: likeCount,
      finalBookmarks: bookmarkCount
    });
    
    return { likeCount, bookmarkCount };
  }, [artwork.likes, artwork.likeCount, artwork.bookmarks, artwork.bookmarkCount, artwork.id]);
  
  // Update bookmarked state based on current user state
  useEffect(() => {
    if (currentUser && currentUser.bookmarks) {
      const artworkIdStr = artwork.id ? artwork.id.toString() : artwork._id?.toString();
      setIsBookmarked(currentUser.bookmarks.some(id => id.toString() === artworkIdStr));
    } else {
      setIsBookmarked(false);
    }
  }, [currentUser, artwork.id, artwork._id]);
  
  useEffect(() => {
    if (initialBookmarked !== undefined) {
      setIsBookmarked(initialBookmarked);
    }
  }, [initialBookmarked]);
  
  const animations = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.4, delay: index * 0.1 }
  };

  const handleLike = () => {
    console.log('ArtCard handleLike clicked:', { artworkId: artwork.id, currentUser: !!currentUser, onLike: !!onLike });
    
    if (!currentUser) {
      console.log('ArtCard handleLike: No current user, showing login toast');
      showToast.error('Please login or create an account to like artworks');
      return;
    }
    
    console.log('ArtCard handleLike: Calling parent onLike function');
    // Let parent handle the API call and state updates completely
    if (onLike) {
      onLike(artwork.id).catch((error) => {
        console.error('Failed to toggle like:', error);
      });
    } else {
      console.error('ArtCard handleLike: onLike prop is missing!');
    }
  };

  const handleBookmark = () => {
    if (!currentUser) {
      showToast.error('Please login or create an account to bookmark artworks');
      return;
    }
    // Let parent handle the API call and state updates completely
    if (onBookmark) {
      onBookmark(artwork.id).catch((error) => {
        console.error('Failed to toggle bookmark:', error);
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <>
      <motion.div 
        className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer"
        {...animations}
        whileHover={{ y: -5, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
      {/* Image Container */}
      <div className="relative overflow-hidden">
        <LazyImage
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-64 group-hover:scale-110 transition-transform duration-500 cursor-pointer"
          aspectRatio=""
          placeholder="🎨"
          onClick={() => onImageClick && onImageClick(artwork)}
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-amber-600/90 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            {artwork.category}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2 z-20">
          {/* Report Button */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all duration-300 z-10"
            onClick={(e) => {
              e.stopPropagation();
              if (!currentUser) {
                showToast.error('Please login to report content');
                return;
              }
              setIsReportModalOpen(true);
            }}
            title="Report artwork"
          >
            <FaFlag size={14} />
          </button>
          
          {/* Bookmark Button */}
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 z-10 ${
              isBookmarked ? 'bg-amber-600 text-white' : 'bg-white/80 text-amber-600 hover:bg-amber-50'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleBookmark();
            }}
            title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          >
            {isBookmarked ? <FaBookmark size={16} /> : <FaRegBookmark size={16} />}
          </button>
          
          {/* Like Button */}
          <button
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 z-10 cursor-pointer ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-red-500 hover:bg-red-50'
            }`}
            onClick={(e) => {
              console.log('LIKE BUTTON CLICKED - RAW EVENT');
              e.preventDefault();
              e.stopPropagation();
              handleLike();
            }}
            onMouseDown={() => console.log('LIKE BUTTON MOUSE DOWN')}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6 flex flex-col space-y-4">
        {/* Title */}
        <motion.h3 
          className="text-xl font-bold text-amber-900 line-clamp-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.2 }}
        >
          {artwork.title}
        </motion.h3>
        
        {/* Description */}
        <motion.p 
          className="text-sm text-amber-700 leading-relaxed line-clamp-3 flex-grow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.3 }}
        >
          {artwork.description}
        </motion.p>
        
        {/* Footer */}
        <motion.div 
          className="flex items-center justify-between pt-4 border-t border-amber-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.4 }}
        >
          <div className="flex flex-col">
            <div className="text-sm">
              <span className="text-amber-700">By: </span>
              <Link 
                to={(() => {
                  const artistId = artwork.userId || artwork.artistId;
                  console.log('ArtCard - artwork.userId:', artwork.userId, 'type:', typeof artwork.userId);
                  console.log('ArtCard - artwork.artistId:', artwork.artistId, 'type:', typeof artwork.artistId);
                  console.log('ArtCard - final artistId:', artistId, 'type:', typeof artistId);
                  return artistId ? `/artist/${artistId}` : "#";
                })()}
                className="font-semibold text-amber-800 hover:text-amber-600 hover:underline transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {artwork.artist}
              </Link>
            </div>
            <span className="text-xs text-gray-500">{formatDate(artwork.createdAt)}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-red-500">
              <FaHeart size={14} />
              <span className="text-sm font-medium">
                {displayCounts.likeCount}
              </span>
            </div>
            <div className="flex items-center space-x-1 text-amber-600">
              <FaBookmark size={14} />
              <span className="text-sm font-medium">
                {displayCounts.bookmarkCount}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
    
    {/* Report Modal */}
    <ReportModal
      isOpen={isReportModalOpen}
      onClose={() => setIsReportModalOpen(false)}
      reportType="artwork"
      reportedItemId={artwork.id}
      reportedItemTitle={artwork.title}
    />
    </>
  );
};

export default ArtCard;


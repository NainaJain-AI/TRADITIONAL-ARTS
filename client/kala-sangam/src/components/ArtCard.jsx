import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { toast } from 'react-toastify';
import LazyImage from './LazyImage';

const ArtCard = ({ artwork, index, currentUser, onLike }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const animations = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.4, delay: index * 0.1 }
  };

  const handleLike = () => {
    if (!currentUser) {
      toast.error('Please login or create an account to like artworks', {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }
    setIsLiked(!isLiked);
    onLike(artwork.id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
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
          className="w-full h-64 group-hover:scale-110 transition-transform duration-500"
          aspectRatio=""
          placeholder="🎨"
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-amber-600/90 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            {artwork.category}
          </span>
        </div>
        
        {/* Like Button */}
        <motion.button
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white/80 text-red-500 hover:bg-red-50'
          }`}
          onClick={handleLike}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {isLiked ? <FaHeart size={16} /> : <FaRegHeart size={16} />}
        </motion.button>
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
                to={`/artist/${artwork.artist.toLowerCase().replace(' ', '-')}`}
                className="font-semibold text-amber-800 hover:text-amber-600 hover:underline transition-colors cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                {artwork.artist}
              </Link>
            </div>
            <span className="text-xs text-gray-500">{formatDate(artwork.createdAt)}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-red-500">
              <FaHeart size={14} />
              <span className="text-sm font-medium">{artwork.likes}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ArtCard;


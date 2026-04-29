import { Link } from 'react-router-dom';
import { HiOutlineShoppingCart, HiCheck, HiStar, HiOutlineDownload } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AnimatedButton, AnimatedLink } from '../lib/motionUtils';
import { useState, useRef, memo } from 'react';
import './GameCard.css';

function GameCard({ game, isOwned = false, isLarge = false }) {
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(game.game_id);
  const imgErrorRef = useRef(false);
  const [imgError, setImgError] = useState(false);

  const discountedPrice = Math.round(
    game.price - (game.price * (game.discount || 0) / 100)
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart && !isOwned) {
      addToCart(game);
      toast.success(`${game.title} added to cart!`);
    }
  };

  const placeholderImage = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="550"><rect fill="#14151C" width="400" height="550"/><text fill="#8E92A4" font-family="sans-serif" font-size="20" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">${game.title.substring(0, 18)}</text></svg>`
  )}`;

  return (
    <motion.div
      whileHover="hover"
      whileTap={{ scale: 0.98 }}
      variants={{ hover: { scale: 1.02 } }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Link
        to={`/game/${game.game_id}`}
        className={`game-card-minimal ${isLarge ? 'game-card-large' : ''}`}
        id={`game-card-${game.game_id}`}
      >
        <div className="game-card-image">
          <motion.img
            variants={{ hover: { scale: 1.08 } }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            key={game.image_url}
            src={imgError ? placeholderImage : game.image_url}
            alt={game.title}
            loading="lazy"
            decoding="async"
            onError={() => {
              if (!imgErrorRef.current) {
                imgErrorRef.current = true;
                setImgError(true);
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              backgroundColor: '#14151C'
            }}
          />
          <div className="game-card-overlay" />
          {isOwned && <span className="badge tag-top-right">✓ LIBRARY</span>}
          {!isOwned && game.discount > 0 && <span className="badge tag-top-left">-{game.discount}%</span>}
        </div>

        <div className="game-card-info">
          <div className="game-card-meta-top">
            {game.category && <span className="game-card-genre">{game.category}</span>}
            {game.rating > 0 && (
              <span className="game-rating">
                <HiStar className="star-icon" /> {Number(game.rating).toFixed(1)}
              </span>
            )}
          </div>
          
          <h3 className="game-card-title">{game.title}</h3>

          <div className="game-card-bottom">
            {game.platform && <span className="game-card-platform">{game.platform}</span>}
            <div className="game-card-price">
              {isOwned ? (
                <span className="price-owned">PURCHASED</span>
              ) : game.discount > 0 ? (
                <>
                  <span className="price-original">{formatPrice(game.price)}</span>
                  <span className="price-current">{formatPrice(discountedPrice)}</span>
                </>
              ) : (
                <span className="price-current">{formatPrice(game.price)}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default memo(GameCard);
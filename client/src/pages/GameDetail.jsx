import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineShoppingCart, HiCheck, HiStar, HiArrowLeft,
  HiOutlineCalendar, HiOutlineDesktopComputer, HiOutlineUserGroup,
  HiOutlineLockClosed, HiOutlineTag, HiChevronLeft, HiChevronRight
} from 'react-icons/hi';
import { motion } from 'framer-motion';
import { AnimatedButton, AnimatedLink } from '../lib/motionUtils';
import toast from 'react-hot-toast';
import './GameDetail.css';

export default function GameDetail() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const [isOwned, setIsOwned] = useState(false);

  useEffect(() => { fetchGame(); }, [id]);
  useEffect(() => { if (user && game) checkOwnership(); }, [user, game]);

  const fetchGame = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('games').select('*')
        .eq('game_id', id).eq('status', 1).eq('isdeleted', 0).single();
      if (error) throw error;
      setGame(data);
    } catch (error) {
      console.error('Error loading game:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOwnership = async () => {
    try {
      const { data } = await supabase.from('library').select('id')
        .eq('user_id', user.id).eq('game_id', game.game_id).eq('isdeleted', 0).single();
      setIsOwned(!!data);
    } catch { setIsOwned(false); }
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const handleAddToCart = () => {
    if (!isInCart(game.game_id)) {
      addToCart(game);
      toast.success(`${game.title} ditambahkan ke keranjang!`);
    }
  };

  const fallbackSvg = (title) =>
    `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect fill="#14141F" width="800" height="450"/><text fill="#D4A853" font-family="sans-serif" font-size="20" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">${title?.substring(0, 25)}</text></svg>`)}`;

  if (loading) {
    return (
      <div className="gd-page">
        <div className="container" style={{ paddingTop: 'calc(var(--navbar-height) + 40px)' }}>
          <div className="skeleton" style={{ height: 28, width: 300, borderRadius: 8, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 44, width: '50%', borderRadius: 10, marginBottom: 32 }} />
          <div className="gd-main-grid">
            <div>
              <div className="skeleton" style={{ height: 380, borderRadius: 16, marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56, width: 90, borderRadius: 8 }} />)}
              </div>
            </div>
            <div className="skeleton" style={{ height: 480, borderRadius: 20 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="gd-page container" style={{ textAlign: 'center', paddingTop: 120 }}>
        <h2>Game tidak ditemukan</h2>
        <AnimatedLink to="/collection" className="btn btn-primary" style={{ marginTop: 24 }}>Kembali ke Koleksi</AnimatedLink>
      </div>
    );
  }

  const discountedPrice = Math.round(game.price - (game.price * (game.discount || 0) / 100));

  return (
    <div className="gd-page">
      <div className="container">

        {/* ── Breadcrumb + Title ── */}
        <motion.div
          className="gd-header"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link to="/collection" className="gd-breadcrumb">
            <HiArrowLeft /> Semua Game
          </Link>
          <h1 className="gd-title">{game.title}</h1>
        </motion.div>

        {/* ── Main Grid ── */}
        <motion.div
          className="gd-main-grid"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          {/* LEFT: Screenshot + Thumbnails */}
          <div className="gd-left">
            <div className="gd-screenshot-box">
              <img
                src={game.detail_image_url || game.image_url}
                alt={game.title}
                className="gd-screenshot-img"
                onError={(e) => { if (!e.target.dataset.hasError) { e.target.dataset.hasError = 'true'; e.target.src = fallbackSvg(game.title); } }}
              />
            </div>

            {/* Thumbnail strip — reuse same image as placeholder */}
            <div className="gd-thumbs">
              {[1, 2, 3, 4, 5].map((_, i) => (
                <div key={i} className={`gd-thumb ${i === 0 ? 'active' : ''}`}>
                  <img
                    src={game.detail_image_url || game.image_url}
                    alt={`screenshot-${i + 1}`}
                    onError={(e) => { if (!e.target.dataset.hasError) { e.target.dataset.hasError = 'true'; e.target.src = fallbackSvg(game.title); } }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Info Panel */}
          <div className="gd-right">
            {/* Logo / Cover */}
            <div className="gd-cover-box" style={game.logo_url ? { background: 'transparent', border: 'none', boxShadow: 'none' } : {}}>
              <img
                src={game.logo_url || game.image_url}
                alt={game.title}
                className="gd-cover-img"
                style={game.logo_url ? { objectFit: 'contain', padding: '16px', maxHeight: '120px', width: 'auto', margin: '0 auto' } : {}}
                onError={(e) => { if (!e.target.dataset.hasError) { e.target.dataset.hasError = 'true'; e.target.src = fallbackSvg(game.title); } }}
              />
            </div>

            {/* Short description */}
            <p className="gd-short-desc">{game.description}</p>

            {/* Meta rows */}
            <div className="gd-meta-rows">
              {game.rating > 0 && (
                <div className="gd-meta-row">
                  <span className="gd-meta-label">Rating</span>
                  <span className="gd-meta-val gd-rating">
                    <HiStar /> {Number(game.rating).toFixed(1)} / 5.0
                  </span>
                </div>
              )}
              {game.release_date && (
                <div className="gd-meta-row">
                  <span className="gd-meta-label">Tanggal Rilis</span>
                  <span className="gd-meta-val">
                    {new Date(game.release_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              {game.developer && (
                <div className="gd-meta-row">
                  <span className="gd-meta-label">Pengembang</span>
                  <span className="gd-meta-val gd-meta-link">{game.developer}</span>
                </div>
              )}
              {game.publisher && (
                <div className="gd-meta-row">
                  <span className="gd-meta-label">Penerbit</span>
                  <span className="gd-meta-val gd-meta-link">{game.publisher}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {(game.category || game.platform) && (
              <div className="gd-tags">
                {game.category && <span className="gd-tag">{game.category}</span>}
                {game.platform && <span className="gd-tag">{game.platform}</span>}
              </div>
            )}
          </div>
        </motion.div>

        {/* ── Action Bar ── */}
        <motion.div
          className="gd-action-bar"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="gd-action-price">
            {game.discount > 0 && (
              <div className="gd-action-discount-row">
                <span className="gd-action-discount-badge">-{game.discount}%</span>
                <span className="gd-action-original">{formatPrice(game.price)}</span>
              </div>
            )}
            <span className="gd-action-final">{formatPrice(discountedPrice)}</span>
          </div>

          <div className="gd-action-right">
            <div className="gd-action-btns">
              {isOwned ? (
                <AnimatedLink to="/library" className="btn btn-secondary btn-lg gd-cta-btn">
                  <HiCheck /> Sudah Dimiliki — Buka Perpustakaan
                </AnimatedLink>
              ) : isInCart(game.game_id) ? (
                <AnimatedLink to="/cart" className="btn btn-secondary btn-lg gd-cta-btn">
                  <HiCheck /> Dalam Keranjang — Lihat Keranjang
                </AnimatedLink>
              ) : (
                <AnimatedButton className="btn btn-primary btn-lg gd-cta-btn" onClick={handleAddToCart}>
                  <HiOutlineShoppingCart /> Tambahkan ke Keranjang
                </AnimatedButton>
              )}
            </div>

            <div className="gd-action-secure">
              <HiOutlineLockClosed />
              <span>Pembayaran aman via Midtrans</span>
            </div>
          </div>
        </motion.div>

        {/* ── Requirements (full width below) ── */}
        {(game.min_requirements || game.rec_requirements) && (
          <motion.div
            className="gd-reqs-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="gd-section-heading">System Requirements</h3>
            <div className="gd-reqs-grid">
              {game.min_requirements && (
                <div className="gd-req-block">
                  <span className="gd-req-label">Minimum</span>
                  <p className="gd-req-text">{game.min_requirements}</p>
                </div>
              )}
              {game.rec_requirements && (
                <div className="gd-req-block">
                  <span className="gd-req-label">Recommended</span>
                  <p className="gd-req-text">{game.rec_requirements}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}

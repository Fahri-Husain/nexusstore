import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';
import { HiX, HiArrowLeft } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { AnimatedButton, AnimatedLink, staggerContainer, staggerItem } from '../lib/motionUtils';
import './Collection.css';

const CATEGORIES = ['Semua', 'Action', 'RPG', 'Adventure', 'Shooter', 'Racing', 'Strategy', 'Sports'];

export default function Collection() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [sortBy, setSortBy] = useState('newest');
  const [ownedGameIds, setOwnedGameIds] = useState(new Set());

  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Fetch user's owned games from library
  useEffect(() => {
    if (!user) {
      setOwnedGameIds(new Set());
      return;
    }

    const fetchLibrary = async () => {
      try {
        const { data, error } = await supabase
          .from('library')
          .select('game_id')
          .eq('user_id', user.id)
          .eq('isdeleted', 0);

        if (error) throw error;
        const ids = new Set((data || []).map(item => item.game_id));
        setOwnedGameIds(ids);
      } catch (err) {
        console.error('Error fetching library:', err);
      }
    };

    fetchLibrary();
  }, [user]);

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('games')
        .select('*')
        .eq('status', 1)
        .eq('isdeleted', 0);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (selectedCategory && selectedCategory !== 'Semua') {
        query = query.ilike('category', `%${selectedCategory}%`);
      }

      switch (sortBy) {
        case 'price-low':
          query = query.order('price', { ascending: true });
          break;
        case 'price-high':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'name':
          query = query.order('title', { ascending: true });
          break;
        default:
          query = query.order('createddate', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      setGames(data || []);
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy, searchQuery]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  return (
    <div className="collection-page">
      <div className="collection-hero">
        <div className="collection-hero-bg" />
        <div className="container">
          <AnimatedLink to="/" className="collection-back">
            <HiArrowLeft /> Back to Home
          </AnimatedLink>
          <h1 className="collection-title">Game Collection</h1>
          <p className="collection-subtitle">
            {searchQuery 
              ? `Search results for "${searchQuery}"`
              : 'Discover and explore our complete catalog of premium games'
            }
          </p>
        </div>
      </div>

      <section className="collection-content container">
        <div className="collection-controls">
          <div className="genre-filters">
            {CATEGORIES.map(cat => (
              <AnimatedButton
                key={cat}
                className={`genre-filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </AnimatedButton>
            ))}
          </div>

          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            id="sort-select"
          >
            <option value="newest">Terbaru</option>
            <option value="price-low">Harga: Rendah ke Tinggi</option>
            <option value="price-high">Harga: Tinggi ke Rendah</option>
            <option value="rating">Rating Tertinggi</option>
            <option value="name">Nama A-Z</option>
          </select>
        </div>

        {searchQuery && (
          <div className="search-result-info">
            <span>Menampilkan {games.length} hasil untuk "{searchQuery}"</span>
            <AnimatedLink to="/collection" className="clear-search">
              <HiX /> Hapus pencarian
            </AnimatedLink>
          </div>
        )}

        {loading ? (
          <div className="collection-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="game-card-skeleton">
                <div className="skeleton" style={{ aspectRatio: '3/4' }} />
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '60%' }} />
                  <div className="skeleton" style={{ height: '18px', width: '90%' }} />
                  <div className="skeleton" style={{ height: '14px', width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : games.length > 0 ? (
          <motion.div 
            className="collection-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {games.map(game => (
              <motion.div key={game.game_id} variants={staggerItem}>
                <GameCard
                  game={game}
                  isOwned={ownedGameIds.has(game.game_id)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="collection-empty">
            <div className="empty-icon">🎮</div>
            <h3>Tidak ada game ditemukan</h3>
            <p>Coba ubah filter atau kata kunci pencarian</p>
          </div>
        )}
      </section>
    </div>
  );
}

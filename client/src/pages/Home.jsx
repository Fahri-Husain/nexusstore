import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';
import HeroSection from '../components/HeroSection';
import { HiOutlineArrowRight } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { AnimatedLink, staggerContainer, staggerItem } from '../lib/motionUtils';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [featuredGames, setFeaturedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownedGameIds, setOwnedGameIds] = useState(new Set());

  useEffect(() => {
    if (!user) {
      setOwnedGameIds(new Set());
      return;
    }
    const fetchLibrary = async () => {
      try {
        const { data } = await supabase
          .from('library')
          .select('game_id')
          .eq('user_id', user.id)
          .eq('isdeleted', 0);
        if (data) {
          setOwnedGameIds(new Set(data.map(item => item.game_id)));
        }
      } catch (err) {
        console.error('Error fetching library:', err);
      }
    };
    fetchLibrary();
  }, [user]);

  const fetchFeaturedGames = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch top 5 games for standard grid
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('status', 1)
        .eq('isdeleted', 0)
        .order('rating', { ascending: false })
        .limit(5);

      if (error) throw error;
      setFeaturedGames(data || []);
    } catch (error) {
      console.error('Error loading featured games:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedGames();
  }, [fetchFeaturedGames]);

  // Framer motion variants are now imported from motionUtils

  return (
    <div className="home-page">
      <div className="hero-wrapper">
        <HeroSection />
      </div>

      <div className="container">
        <div className="section-divider"></div>
      </div>

      <section className="featured-section container">
        <div className="featured-header">
          <div>
            <h2 className="featured-title tracking-wide">PILIHAN TERBAIK</h2>
            <p className="featured-subtitle">Game-game pilihan terbaik untuk koleksi Anda</p>
          </div>
          <Link to="/collection" className="featured-view-all">
            LIHAT SEMUA <HiOutlineArrowRight />
          </Link>
        </div>

        {loading ? (
          <div className="home-grid">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="home-grid-item">
                <div className="game-card-skeleton">
                  <div className="skeleton" style={{ aspectRatio: '3/4' }} />
                </div>
              </div>
            ))}
          </div>
        ) : featuredGames.length > 0 ? (
          <motion.div 
            className="home-grid"
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {featuredGames.map((game) => (
              <motion.div 
                key={game.game_id} 
                className="home-grid-item"
                variants={staggerItem}
              >
                <GameCard
                  game={game}
                  isOwned={ownedGameIds.has(game.game_id)}
                  isLarge={false}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : null}
      </section>

      <section className="cta-section container">
        <motion.div 
          className="cta-card"
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.h2 variants={staggerItem} className="cta-title tracking-wide">PERLUAS WAWASANMU</motion.h2>
          <motion.p variants={staggerItem} className="cta-desc">
            Jelajahi koleksi lengkap aset digital premium kami. Dipilih dengan cermat, diuji dengan ketat, dan dikirim secara instan.
          </motion.p>
          <motion.div variants={staggerItem}>
            <AnimatedLink to="/collection" className="btn btn-secondary btn-large">
              JELAJAHI KOLEKSI LENGKAP
            </AnimatedLink>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}

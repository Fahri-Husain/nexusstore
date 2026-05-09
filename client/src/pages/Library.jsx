import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { HiOutlineDownload, HiOutlineCollection } from 'react-icons/hi';
import { staggerContainer, staggerItem } from '../lib/motionUtils';
import './Library.css';

export default function Library() {
  const { user } = useAuth();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (user) fetchLibrary(); }, [user]);

  const fetchLibrary = async () => {
    try {
      // Cek apakah ada pending order dari checkout (berguna untuk mobile yang sering reload)
      const pendingOrder = localStorage.getItem('pending_order');
      if (pendingOrder) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');
          await fetch(`${API_URL}/payment/confirm-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_code: pendingOrder }),
          });
          localStorage.removeItem('pending_order');
        } catch (err) {
          console.error('Error confirming pending order:', err);
        }
      }

      let data, error;
      const result = await supabase
        .from('library')
        .select('*, games(*)')
        .eq('user_id', user.id)
        .eq('isdeleted', 0)
        .order('purchased_at', { ascending: false });
      data = result.data; error = result.error;

      if (error?.code === 'PGRST200') {
        const libResult = await supabase.from('library').select('*').eq('user_id', user.id).eq('isdeleted', 0).order('purchased_at', { ascending: false });
        if (libResult.error) throw libResult.error;
        const gameIds = (libResult.data || []).map(l => l.game_id).filter(Boolean);
        let gamesMap = {};
        if (gameIds.length > 0) {
          const gamesResult = await supabase.from('games').select('*').in('game_id', gameIds);
          if (gamesResult.data) gamesResult.data.forEach(g => { gamesMap[g.game_id] = g; });
        }
        data = (libResult.data || []).map(item => ({ ...item, games: gamesMap[item.game_id] || null }));
      } else if (error) throw error;

      setLibrary(data || []);
    } catch (err) {
      console.error('Error loading library:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="library-page">
        <div className="container">
          <h1 className="library-page-title">Perpustakaan</h1>
          <div className="library-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="library-card-skeleton">
                <div style={{ aspectRatio: '3/4' }} />
                <div style={{ padding: 12 }}>
                  <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 6, borderRadius: 4 }} />
                  <div className="skeleton" style={{ height: 10, width: '50%', borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="library-page">
      <div className="container">
        <motion.h1
          className="library-page-title"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Perpustakaan
        </motion.h1>

        {library.length === 0 ? (
          <div className="library-empty">
            <HiOutlineCollection className="library-empty-icon" />
            <h2>Perpustakaan Kosong</h2>
            <p>Kamu belum memiliki game. Beli game pertamamu sekarang!</p>
            <Link to="/collection" className="btn btn-primary" style={{ marginTop: 8 }}>
              Jelajahi Game
            </Link>
          </div>
        ) : (
          <motion.div
            className="library-grid"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {library.map(item => (
              <motion.div key={item.id} className="library-card" variants={staggerItem}>
                <Link to={`/game/${item.games?.game_id || item.game_id}`} className="library-card-image">
                  <img
                    src={item.games?.image_url}
                    alt={item.games?.title}
                    onError={e => {
                      if (!e.target.dataset.hasError) {
                        e.target.dataset.hasError = 'true';
                        e.target.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="267"><rect fill="#14141F" width="200" height="267"/><text fill="#555" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">${(item.games?.title || 'Game').substring(0, 16)}</text></svg>`)}`;
                      }
                    }}
                  />
                  <div className="library-card-overlay">
                    <button className="library-download-btn">
                      <HiOutlineDownload /> Unduh
                    </button>
                  </div>
                </Link>
                <div className="library-card-info">
                  <Link to={`/game/${item.games?.game_id || item.game_id}`} className="library-card-title">
                    {item.games?.title || 'Game'}
                  </Link>
                  <span className="library-card-date">
                    {new Date(item.purchased_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

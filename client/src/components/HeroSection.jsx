import { useState, useEffect, useRef } from 'react';
import { AnimatedLink } from '../lib/motionUtils';
import { supabase } from '../lib/supabase';
import './HeroSection.css';

export default function HeroSection() {
  const [games, setGames] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef(null);

  const SLIDE_DURATION = 7000;

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data } = await supabase
          .from('games')
          .select('*')
          .eq('isdeleted', 0)
          .eq('is_carousel', true)
          .order('createddate', { ascending: false })
          .limit(8);

        if (data && data.length > 0) {
          setGames(data);
        }
      } catch (err) {
        console.error('Failed to fetch games for hero:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGames();
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (games.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex(prev => {
        setPrevIndex(prev);
        return (prev + 1) % games.length;
      });
      setAnimKey(k => k + 1);
    }, SLIDE_DURATION);
  };

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [games.length, currentIndex]);

  const handleThumbnailClick = (index) => {
    if (index === currentIndex) return;
    setPrevIndex(currentIndex);
    setCurrentIndex(index);
    setAnimKey(k => k + 1);
  };

  if (isLoading) {
    return (
      <section className="hero-epic-container">
        <div className="hero-epic-content">
          <div className="hero-epic-main">
            <div className="skeleton-box" style={{ width: '100%', height: '100%', borderRadius: '16px' }} />
          </div>
          <div className="hero-epic-sidebar">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="hero-epic-thumbnail skeleton-box" style={{ height: '100px', borderRadius: '12px' }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (games.length === 0) {
    return (
      <section className="hero-epic-container" style={{ minHeight: '400px' }}>
        <div className="container" style={{ textAlign: 'center', opacity: 0.5 }}>
          <h2>Belum ada game tersedia.</h2>
        </div>
      </section>
    );
  }

  const activeGame = games[currentIndex];

  return (
    <section className="hero-epic-container">
      <div className="hero-epic-content">

        {/* === MAIN DISPLAY (KIRI) === */}
        <div className="hero-epic-main">

          {/* Background images - crossfade via CSS opacity */}
          <div className="hero-bg-stage">
            {games.map((game, index) => (
              <div
                key={game.game_id}
                className={`hero-main-bg ${index === currentIndex ? 'active' : ''}`}
                style={{ backgroundImage: `url(${game.hero_image_url || game.image_url})` }}
              />
            ))}
          </div>

          {/* Overlay gradient */}
          <div className="hero-main-overlay">
            {/* Content layer - animates in/out with CSS classes keyed to animKey */}
            <div key={`content-${animKey}`} className="hero-main-info hero-content-enter">
              <div className="hero-badge-epic">BARU RILIS</div>

              {activeGame.logo_url ? (
                <img
                  src={activeGame.logo_url}
                  alt={activeGame.title}
                  className="hero-main-logo hero-logo-enter"
                />
              ) : (
                <h2 className="hero-main-title">
                  {activeGame.title}
                </h2>
              )}

              <p className="hero-main-desc">
                {activeGame.description?.substring(0, 120)}...
              </p>

              <div className="hero-main-price-row">
                {activeGame.discount > 0 ? (
                  <>
                    <span className="hero-discount-badge">-{activeGame.discount}%</span>
                    <div className="hero-price-stack">
                      <span className="hero-price-original">Rp {activeGame.price.toLocaleString('id-ID')}</span>
                      <span className="hero-price-final">Rp {(activeGame.price - (activeGame.price * activeGame.discount / 100)).toLocaleString('id-ID')}</span>
                    </div>
                  </>
                ) : (
                  <span className="hero-price-final">
                    {activeGame.price === 0 ? 'GRATIS' : `Rp ${activeGame.price.toLocaleString('id-ID')}`}
                  </span>
                )}
              </div>

              <AnimatedLink to={`/game/${activeGame.game_id}`} className="btn btn-primary btn-epic">
                LIHAT GAME
              </AnimatedLink>
            </div>
          </div>
        </div>

        {/* === THUMBNAIL SIDEBAR (KANAN) === */}
        <div className="hero-epic-sidebar">
          {games.map((game, index) => {
            const isActive = index === currentIndex;
            return (
              <div
                key={game.game_id}
                className={`hero-epic-thumbnail ${isActive ? 'active' : ''}`}
                onClick={() => handleThumbnailClick(index)}
              >
                {/* Progress fill layer - only on active */}
                {isActive && (
                  <div
                    key={`progress-${animKey}`}
                    className="hero-epic-progress"
                    style={{ animationDuration: `${SLIDE_DURATION}ms` }}
                  />
                )}

                {/* Content */}
                <div className="hero-epic-thumbnail-content">
                  <img src={game.image_url} alt={game.title} className="hero-thumbnail-img" />
                  <span className="hero-thumbnail-title">{game.title}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

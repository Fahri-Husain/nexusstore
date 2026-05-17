import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLink } from '../lib/motionUtils';
import { supabase } from '../lib/supabase';
import './HeroSection.css';

export default function HeroSection() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('createddate', { ascending: false });
        if (data && data.length > 0) setBanners(data);
      } catch (err) {
        console.error('Failed to fetch banners:', err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.4 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const activeBanner = banners[currentIndex];

  return (
    <section className="hero-minimalist" style={{ position: 'relative' }}>
      {/* Smooth Background Transition */}
      <AnimatePresence>
        {activeBanner && (
          <motion.div
            key={`bg-${currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundImage: `linear-gradient(to right, rgba(20, 21, 28, 0.98) 0%, rgba(20, 21, 28, 0.7) 40%, rgba(20, 21, 28, 0.1) 100%), url(${activeBanner.image_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
              zIndex: 0
            }}
          />
        )}
      </AnimatePresence>

      {/* Subtle ambient light */}
      {!activeBanner && <div className="hero-ambient" style={{ zIndex: 1 }} />}
      
      <div className="container hero-content" style={{ zIndex: 2, position: 'relative' }}>
        <AnimatePresence mode="wait">
          <motion.div 
            key={`content-${currentIndex}`}
            className="hero-text-wrapper"
            variants={container}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <motion.div variants={item} className="hero-badge">
              <span className="badge">KOLEKSI PILIHAN</span>
            </motion.div>
            
            <motion.h1 variants={item} className="hero-title tracking-wide">
              {activeBanner ? (
                activeBanner.title.split('\n').map((line, i) => (
                  <span key={i} className="hero-title-gradient" style={{ display: 'block' }}>{line}</span>
                ))
              ) : (
                <>
                  <span className="hero-title-gradient">ELEVATE</span> <br />
                  <span className="hero-title-gradient">YOUR PLAY.</span>
                </>
              )}
            </motion.h1>
            
            <motion.p variants={item} className="hero-subtitle" style={{ maxWidth: '600px', textShadow: activeBanner ? '0 2px 10px rgba(0,0,0,0.8)' : 'none' }}>
              {activeBanner ? activeBanner.subtitle : (
                <>
                  Koleksi pilihan aset digital berkualitas tinggi.
                  <br /> Rasakan generasi terbaru pengalaman interaktif yang tak terlupakan.
                </>
              )}
            </motion.p>
            
            <motion.div variants={item} className="hero-cta-group">
              <AnimatedLink to={activeBanner?.target_url || "/collection"} className="btn btn-primary btn-large" style={{ boxShadow: activeBanner ? '0 8px 30px rgba(212, 168, 83, 0.3)' : 'none' }}>
                {activeBanner ? 'LIHAT PROMO' : 'JELAJAHI KOLEKSI'}
              </AnimatedLink>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel indicators moved outside AnimatePresence so they stay fixed */}
        {banners.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '48px', alignItems: 'center', justifyContent: 'center' }}>
            {banners.map((_, i) => (
              <div 
                key={i} 
                onClick={() => setCurrentIndex(i)} 
                style={{ 
                  width: i === currentIndex ? '32px' : '8px', 
                  height: '6px', 
                  borderRadius: '4px', 
                  background: i === currentIndex ? '#D4A853' : 'rgba(255,255,255,0.2)', 
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                  cursor: 'pointer' 
                }} 
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

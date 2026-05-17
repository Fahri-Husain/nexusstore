import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { AnimatedLink } from '../lib/motionUtils';
import './PromoBanner.css';

export default function PromoBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('createddate', { ascending: false })
          .limit(1)
          .single();
        
        if (data) {
          setBanner(data);
        }
      } catch (err) {
        // abaikan jika tidak ada banner aktif (akan error row not found dari single())
      }
    };
    fetchBanner();
  }, []);

  if (!banner) return null;

  return (
    <AnimatePresence>
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="promo-mega-section"
        style={{ backgroundImage: `url(${banner.image_url})` }}
      >
        <div className="promo-mega-overlay">
          <div className="promo-mega-content">
            <h1 className="promo-mega-title">{banner.title}</h1>
            {banner.subtitle && <p className="promo-mega-subtitle">{banner.subtitle}</p>}
            
            <AnimatedLink to={banner.target_url || "/collection"} className="btn btn-promo-mega">
              LIHAT PROMO
            </AnimatedLink>
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}

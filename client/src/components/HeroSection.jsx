import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimatedLink } from '../lib/motionUtils';
import './HeroSection.css';

export default function HeroSection() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <section className="hero-minimalist">
      {/* Subtle ambient light */}
      <div className="hero-ambient" />
      
      <div className="container hero-content">
        <motion.div 
          className="hero-text-wrapper"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={item} className="hero-badge">
            <span className="badge">KOLEKSI PILIHAN</span>
          </motion.div>
          
          <motion.h1 variants={item} className="hero-title tracking-wide">
            <span className="hero-title-gradient">ELEVATE</span> <br />
            <span className="hero-title-gradient">YOUR PLAY.</span>
          </motion.h1>
          
          <motion.p variants={item} className="hero-subtitle">
            Koleksi pilihan aset digital berkualitas tinggi.
            <br /> Rasakan generasi terbaru pengalaman interaktif yang tak terlupakan.
          </motion.p>
          
          <motion.div variants={item} className="hero-cta-group">
            <AnimatedLink to="/collection" className="btn btn-primary btn-large">
              JELAJAHI KOLEKSI
            </AnimatedLink>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

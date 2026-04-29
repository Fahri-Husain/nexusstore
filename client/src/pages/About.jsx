import { HiOutlineLightningBolt, HiOutlineShieldCheck, HiOutlineGlobe, HiOutlineCreditCard } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motionUtils';
import './About.css';

export default function About() {
  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-hero-glow" />
        <div className="container">
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer}
          >
            <motion.h1 className="about-title" variants={staggerItem}>
              Tentang <span className="about-title-accent">Nexus Store</span>
            </motion.h1>
            <motion.p className="about-desc" variants={staggerItem}>
              Destinasi utama untuk aset gaming digital generasi berikutnya.
              Kami menyediakan ekosistem marketplace yang mulus dengan teknologi terkini,
              menawarkan transaksi instan, pembaruan real-time, dan perpustakaan game premium yang terkurasi.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="container">
        {/* Stats */}
        <motion.div 
          className="about-stats"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
        >
          <motion.div className="about-stat-card" variants={staggerItem}>
            <span className="about-stat-number">1000+</span>
            <span className="about-stat-label">Game Premium</span>
          </motion.div>
          <motion.div className="about-stat-card" variants={staggerItem}>
            <span className="about-stat-number">50K+</span>
            <span className="about-stat-label">Gamer Bahagia</span>
          </motion.div>
          <motion.div className="about-stat-card" variants={staggerItem}>
            <span className="about-stat-number">99.9%</span>
            <span className="about-stat-label">Uptime</span>
          </motion.div>
          <motion.div className="about-stat-card" variants={staggerItem}>
            <span className="about-stat-number">24/7</span>
            <span className="about-stat-label">Dukungan</span>
          </motion.div>
        </motion.div>

        {/* Features Bento Grid */}
        <motion.div 
          className="about-content"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div className="about-card" variants={staggerItem}>
            <div className="about-card-icon"><HiOutlineLightningBolt /></div>
            <h3>Pengiriman Instan</h3>
            <p>Dapatkan game Anda langsung setelah pembelian. Tanpa menunggu, tanpa penundaan. Mulai bermain dalam hitungan detik setelah transaksi selesai.</p>
          </motion.div>
          <motion.div className="about-card" variants={staggerItem}>
            <div className="about-card-icon"><HiOutlineShieldCheck /></div>
            <h3>Pembayaran Aman</h3>
            <p>Semua transaksi diproses melalui Midtrans dengan enkripsi tingkat bank. Informasi pembayaran Anda selalu terlindungi.</p>
          </motion.div>
          <motion.div className="about-card" variants={staggerItem}>
            <div className="about-card-icon"><HiOutlineGlobe /></div>
            <h3>Koleksi Terkurasi</h3>
            <p>Setiap game dalam katalog kami dipilih secara cermat untuk kualitasnya. Kami bekerja langsung dengan penerbit untuk menghadirkan judul terbaik.</p>
          </motion.div>
          <motion.div className="about-card" variants={staggerItem}>
            <div className="about-card-icon"><HiOutlineCreditCard /></div>
            <h3>Harga Terbaik</h3>
            <p>Nikmati harga kompetitif dengan diskon reguler dan penawaran eksklusif. Dapatkan nilai lebih untuk setiap rupiah yang Anda keluarkan.</p>
          </motion.div>
        </motion.div>

        {/* Mission */}
        <motion.div 
          className="about-mission"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUpVariant}
        >
          <div className="about-mission-bg" />
          <h2 className="about-mission-title">Misi Kami</h2>
          <p className="about-mission-text">
            Memberdayakan para gamer dan pengembang dengan menyediakan platform yang aman, cepat, dan andal
            untuk menemukan dan mendistribusikan konten digital. Kami percaya bahwa gaming seharusnya
            mudah diakses, terjangkau, dan menyenangkan bagi semua orang.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLocationMarker, HiLightningBolt } from 'react-icons/hi';
import { FaTwitter, FaInstagram, FaDiscord, FaYoutube } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer-card">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <HiLightningBolt className="logo-icon" />
              <span className="logo-text">NEXUS STORE</span>
            </div>
            <p className="footer-desc">
              Toko game digital terpercaya dengan koleksi game terlengkap dan harga terbaik. Pembayaran aman & mudah.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" className="social-link" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" className="social-link" aria-label="Discord"><FaDiscord /></a>
              <a href="#" className="social-link" aria-label="YouTube"><FaYoutube /></a>
            </div>
          </div>

          <div className="footer-links">
            <h4 className="footer-title">Navigasi</h4>
            <Link to="/">Beranda</Link>
            <Link to="/collection">Koleksi</Link>
            <Link to="/cart">Keranjang</Link>
            <Link to="/library">Perpustakaan</Link>
          </div>

          <div className="footer-links">
            <h4 className="footer-title">Kategori</h4>
            <Link to="/collection?category=Action">Action</Link>
            <Link to="/collection?category=RPG">RPG</Link>
            <Link to="/collection?category=Adventure">Adventure</Link>
            <Link to="/collection?category=Shooter">Shooter</Link>
          </div>

          <div className="footer-links">
            <h4 className="footer-title">Bantuan</h4>
            <a href="#">FAQ</a>
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat & Ketentuan</a>
            <div className="footer-contact">
              <HiOutlineMail /> support@nexusstore.id
            </div>
            <div className="footer-contact">
              <HiOutlineLocationMarker /> Jakarta, Indonesia
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Nexus Store. Semua hak dilindungi.</p>
          <div className="footer-bottom-links">
            <p className="footer-payment-text">Pembayaran aman oleh Midtrans</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

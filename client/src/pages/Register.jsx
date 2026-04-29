import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineUserGroup, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { AnimatedButton } from '../lib/motionUtils';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error('Mohon isi semua field');
      return;
    }
    if (password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Password tidak cocok');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, fullName);
      toast.success('Pendaftaran berhasil! Silakan cek email untuk verifikasi.');
      navigate('/login');
    } catch (error) {
      if (error.message.includes('already registered')) {
        toast.error('Email sudah terdaftar');
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error('Gagal daftar dengan Google');
    }
  };

  return (
    <motion.div 
      className="auth-split-page"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      
      {/* Left Side: Form */}
      <div className="auth-left">
        <Link to="/" className="auth-logo" style={{ textDecoration: 'none' }}>
          <span className="logo-desktop">NEXUS STORE.</span>
          <span className="logo-mobile"><HiOutlineArrowLeft /> Kembali ke Beranda</span>
        </Link>
        
        <div className="auth-content-wrapper">
          <div className="auth-header-split">
            <motion.h1 
              className="auth-title-split"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
            >
              Bergabung bersama kami!
            </motion.h1>
            <motion.p 
              className="auth-subtitle-split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
            >
              Buat akun Nexus Store baru.
            </motion.p>
          </div>

          <AnimatedButton className="split-btn split-btn-google" onClick={handleGoogleLogin} disabled={loading}>
            <FcGoogle size={20} /> Daftar dengan Google
          </AnimatedButton>

          <div className="split-divider">
            <span>atau</span>
          </div>

          <form className="auth-form-split" onSubmit={handleRegister}>
            <div className="split-input-wrapper">
              <input
                type="text"
                className="split-input"
                placeholder="Nama Lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="split-input-wrapper">
              <input
                type="email"
                className="split-input"
                placeholder="Email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="split-input-wrapper">
              <input
                type="password"
                className="split-input"
                placeholder="Kata sandi (Min. 6 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="split-input-wrapper">
              <input
                type="password"
                className="split-input"
                placeholder="Konfirmasi Kata Sandi"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <AnimatedButton type="submit" className="split-btn split-btn-primary" disabled={loading}>
              {loading ? 'Membuat...' : 'Daftar'}
            </AnimatedButton>
          </form>

          <div className="split-footer">
            Sudah punya akun? <Link to="/login">Masuk</Link>
          </div>
        </div>
      </div>

      {/* Right Side: Image Overlay */}
      <div className="auth-right">
        <div className="auth-right-top">
          <div>{/* Empty right area for alignment */}</div>
        </div>

        <div className="auth-right-bottom">
          <motion.h2 
            className="auth-quote"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.2 }}
          >
            Embark on an epic journey in a world of limitless adventures!
          </motion.h2>
          <motion.div 
            className="auth-quote-controls"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
          >
          </motion.div>
        </div>
      </div>
      
    </motion.div>
  );
}

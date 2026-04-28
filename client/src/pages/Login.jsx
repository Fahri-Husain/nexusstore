import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { FcGoogle } from 'react-icons/fc';
import { HiOutlineUserGroup, HiOutlineArrowLeft, HiOutlineArrowRight } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { AnimatedButton } from '../lib/motionUtils';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA State
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState('');

  const { signInWithEmail, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Mohon isi semua field');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      await signOut();
      const { error: otpError } = await supabase.auth.signInWithOtp({ email });
      if (otpError) throw otpError;

      setShowOtpForm(true);
      toast.success('Kode OTP telah dikirim ke email Anda');
    } catch (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Masukkan kode OTP');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
      if (error) throw error;
      toast.success('Berhasil masuk!');
      navigate('/');
    } catch (error) {
      toast.error(error.message === 'Token has expired or is invalid' ? 'Kode OTP salah atau kedaluwarsa' : error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error('Gagal masuk dengan Google');
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
          NEXUS STORE.
        </Link>

        <div className="auth-content-wrapper">
          <div className="auth-header-split">
            <motion.h1
              className="auth-title-split"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.1 }}
            >
              Hi there!
            </motion.h1>
            <motion.p
              className="auth-subtitle-split"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.3 }}
            >
              Welcome to Nexus Store.
            </motion.p>
          </div>

          <AnimatedButton className="split-btn split-btn-google" onClick={handleGoogleLogin} disabled={loading}>
            <FcGoogle size={20} /> Log in with Google
          </AnimatedButton>

          <div className="split-divider">
            <span>or</span>
          </div>

          {!showOtpForm ? (
            <form className="auth-form-split" onSubmit={handleEmailLogin}>
              <div className="split-input-wrapper">
                <input
                  type="email"
                  className="split-input"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="split-input-wrapper">
                <input
                  type="password"
                  className="split-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>

              <AnimatedButton type="submit" className="split-btn split-btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </AnimatedButton>
            </form>
          ) : (
            <form className="auth-form-split" onSubmit={handleOtpSubmit}>
              <div className="split-input-wrapper">
                <input
                  type="text"
                  className="split-input"
                  placeholder="Enter OTP Code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={10}
                  required
                />
              </div>
              <AnimatedButton type="submit" className="split-btn split-btn-primary" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </AnimatedButton>
              <AnimatedButton type="button" className="split-btn" style={{ background: 'transparent', border: '1px solid #E0E0E0' }} onClick={() => setShowOtpForm(false)}>
                Back to Login
              </AnimatedButton>
            </form>
          )}

          <div className="split-footer">
            Don't have an account? <Link to="/register">Sign up</Link>
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
            Go anywhere you want in a Galaxy full of wonders!
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

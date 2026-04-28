import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineShoppingCart, HiOutlineUser, HiMenu, HiX, HiOutlineLogout, HiOutlineCollection, HiOutlineClock, HiOutlineShieldCheck, HiOutlineHome, HiOutlineLogin } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedLink, AnimatedButton } from '../lib/motionUtils';
import './Navbar.css';

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const [scrolled, setScrolled] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.profile-dropdown')) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setProfileMenuOpen(false);
    setMenuVisible(false);
  };

  const getAvatarUrl = () => {
    return profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  };

  const springConfig = { type: "spring", stiffness: 300, damping: 30 };

  return (
    <>
    <motion.nav 
      className={`navbar glass-capsule ${scrolled ? 'scrolled' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...springConfig, delay: 0.1 }}
    >
      <div className="navbar-container container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text tracking-wide">NEXUS</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>HOME</Link>
          <Link to="/collection" className={`nav-link ${pathname === '/collection' ? 'active' : ''}`}>COLLECTION</Link>
          <Link to="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>ABOUT</Link>
        </div>

        <div className="navbar-actions">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Link to="/cart" className="navbar-icon-btn">
              <HiOutlineShoppingCart />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span 
                    className="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </motion.div>

          {user ? (
            <div className="profile-dropdown">
              <AnimatedButton
                className="profile-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileMenuOpen(!profileMenuOpen);
                }}
              >
                {getAvatarUrl() && !avatarError ? (
                  <img
                    src={getAvatarUrl()}
                    alt=""
                    className="profile-avatar"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <HiOutlineUser />
                )}
              </AnimatedButton>

              <AnimatePresence>
                {profileMenuOpen && (
                  <motion.div 
                    className="profile-menu"
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    <div className="profile-menu-header">
                      <span className="profile-name">{profile?.full_name || user.email?.split('@')[0]}</span>
                    </div>
                    <Link to="/profile" className="profile-menu-item" onClick={() => setProfileMenuOpen(false)}>Profile</Link>
                    <Link to="/library" className="profile-menu-item" onClick={() => setProfileMenuOpen(false)}>Library</Link>
                    <Link to="/orders" className="profile-menu-item" onClick={() => setProfileMenuOpen(false)}>Orders</Link>
                    {isAdmin && (
                      <Link to="/admin" className="profile-menu-item admin-item" onClick={() => setProfileMenuOpen(false)}>Admin</Link>
                    )}
                    <div className="profile-menu-divider" />
                    <button className="profile-menu-item logout-item" onClick={handleSignOut}>Sign Out</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <AnimatedLink to="/login" className="btn btn-primary btn-shop">
              SHOP NOW
            </AnimatedLink>
          )}

          <button className="mobile-menu-btn" onClick={() => setMenuVisible(true)}>
            <HiMenu />
          </button>
        </div>
      </div>
    </motion.nav>

    {/* Mobile Menu */}
    <AnimatePresence>
      {menuVisible && (
        <>
          <motion.div
            className="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMenuVisible(false)}
          />
          <motion.div 
            className="mobile-menu"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={springConfig}
          >
            <div className="mobile-menu-header">
              <span className="logo-text tracking-wide">NEXUS</span>
              <button className="mobile-close-btn" onClick={() => setMenuVisible(false)}>
                <HiX />
              </button>
            </div>
            
            <div className="mobile-menu-content">
              {user && (
                <div className="mobile-profile">
                  <div className="mobile-avatar">
                    {getAvatarUrl() && !avatarError ? (
                      <img src={getAvatarUrl()} alt="" onError={() => setAvatarError(true)} />
                    ) : (
                      <HiOutlineUser />
                    )}
                  </div>
                  <span>{profile?.full_name || user.email?.split('@')[0]}</span>
                </div>
              )}
              
              <Link to="/" className="mobile-link" onClick={() => setMenuVisible(false)}>HOME</Link>
              <Link to="/collection" className="mobile-link" onClick={() => setMenuVisible(false)}>COLLECTION</Link>
              <Link to="/about" className="mobile-link" onClick={() => setMenuVisible(false)}>ABOUT</Link>
              <Link to="/cart" className="mobile-link" onClick={() => setMenuVisible(false)}>
                CART {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </Link>

              {user ? (
                <>
                  <div className="mobile-divider" />
                  <Link to="/profile" className="mobile-link" onClick={() => setMenuVisible(false)}>PROFILE</Link>
                  <Link to="/library" className="mobile-link" onClick={() => setMenuVisible(false)}>LIBRARY</Link>
                  <Link to="/orders" className="mobile-link" onClick={() => setMenuVisible(false)}>ORDERS</Link>
                  {isAdmin && <Link to="/admin" className="mobile-link admin" onClick={() => setMenuVisible(false)}>ADMIN</Link>}
                  <button className="mobile-link logout" onClick={handleSignOut}>SIGN OUT</button>
                </>
              ) : (
                <Link to="/login" className="mobile-link" onClick={() => setMenuVisible(false)}>SIGN IN</Link>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}

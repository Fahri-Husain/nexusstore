import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import GameDetail from './pages/GameDetail';
import Cart from './pages/Cart';
import About from './pages/About';
import Collection from './pages/Collection';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Library from './pages/Library';
import OrderHistory from './pages/OrderHistory';
import Invoice from './pages/Invoice';
import PaymentStatus from './pages/PaymentStatus';
import AdminPanel from './pages/AdminPanel';
import Support from './pages/Support';
import ScrollToTop from './components/ScrollToTop';
import { useCart } from './context/CartContext';
import { supabase } from './lib/supabase';
import { HiOutlineExclamationCircle, HiOutlineInformationCircle } from 'react-icons/hi';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

function App() {
  const location = useLocation();
  const { clearCart } = useCart();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');
  const hideNavAndFooter = isAuthPage || isAdminPage;
  const [broadcast, setBroadcast] = useState(null);

  useEffect(() => {
    const fetchBroadcast = async () => {
      try {
        const { data } = await supabase.from('broadcasts').select('*').eq('is_active', true).order('createddate', { ascending: false }).limit(1);
        if (data && data.length > 0) setBroadcast(data[0]);
      } catch (err) {
        console.error('Error fetching broadcast:', err);
      }
    };
    fetchBroadcast();
  }, [location.pathname]); // Re-check on navigation

  useEffect(() => {
    const checkPendingOrder = async () => {
      const pendingOrder = localStorage.getItem('pending_order');
      if (pendingOrder) {
        try {
          await fetch(`${API_URL}/payment/confirm-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_code: pendingOrder }),
          });
          localStorage.removeItem('pending_order');
          clearCart();
        } catch (err) {
          console.error('Error confirming pending order globally:', err);
        }
      }
    };
    checkPendingOrder();
  }, [location.pathname, clearCart]);

  const isHomePage = location.pathname === '/';
  const showBroadcast = broadcast && !isAdminPage && !isAuthPage && isHomePage;

  return (
    <div className={`app ${!hideNavAndFooter ? 'app-fancy-bg' : ''} ${isAdminPage ? 'admin-layout' : ''}`}>
      <ScrollToTop />
      <AnimatePresence>
        {showBroadcast && (
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="global-broadcast-banner" style={{ 
          background: broadcast.type === 'error' ? 'var(--accent-red)' : broadcast.type === 'warning' ? 'var(--accent-yellow)' : '#3A86FF', 
          color: broadcast.type === 'warning' ? '#000' : '#fff',
          padding: '8px 16px', 
          textAlign: 'center', 
          fontSize: '0.9rem', 
          fontWeight: 500,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          zIndex: 900,
          position: 'absolute',
          top: 'var(--navbar-height, 70px)',
          left: 0,
          width: '100%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
          {broadcast.type === 'error' || broadcast.type === 'warning' ? <HiOutlineExclamationCircle size={18} /> : <HiOutlineInformationCircle size={18} />}
            {broadcast.message}
          </motion.div>
        )}
      </AnimatePresence>
      {!hideNavAndFooter && <Navbar hasBroadcast={showBroadcast} />}
      
      <main className={hideNavAndFooter && !isAdminPage ? "" : isAdminPage ? "admin-main" : "main-content"} style={!hideNavAndFooter && !isAdminPage ? { paddingTop: showBroadcast ? '108px' : '64px' } : {}}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
            <Route path="/game/:id" element={<PageTransition><GameDetail /></PageTransition>} />
            <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
            <Route path="/about" element={<PageTransition><About /></PageTransition>} />
            <Route path="/collection" element={<PageTransition><Collection /></PageTransition>} />
            <Route path="/checkout" element={
              <ProtectedRoute><PageTransition><Checkout /></PageTransition></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><PageTransition><Profile /></PageTransition></ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute><PageTransition><Library /></PageTransition></ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute><PageTransition><OrderHistory /></PageTransition></ProtectedRoute>
            } />
            <Route path="/invoice/:orderCode" element={
              <ProtectedRoute><PageTransition><Invoice /></PageTransition></ProtectedRoute>
            } />
            <Route path="/payment/:status" element={<PageTransition><PaymentStatus /></PageTransition>} />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly><PageTransition><AdminPanel /></PageTransition></ProtectedRoute>
            } />
            <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      {!hideNavAndFooter && <Footer />}
    </div>
  );
}

export default App;

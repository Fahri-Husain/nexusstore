import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import PaymentStatus from './pages/PaymentStatus';
import AdminPanel from './pages/AdminPanel';
import Support from './pages/Support';
import ScrollToTop from './components/ScrollToTop';
import { useCart } from './context/CartContext';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

function App() {
  const location = useLocation();
  const { clearCart } = useCart();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

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

  return (
    <div className={`app ${!isAuthPage ? 'app-fancy-bg' : ''}`}>
      <ScrollToTop />
      {!isAuthPage && <Navbar />}
      
      <main className={isAuthPage ? "" : "main-content"}>
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
            <Route path="/payment/:status" element={<PageTransition><PaymentStatus /></PageTransition>} />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly><PageTransition><AdminPanel /></PageTransition></ProtectedRoute>
            } />
            <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </main>

      {!isAuthPage && <Footer />}
    </div>
  );
}

export default App;

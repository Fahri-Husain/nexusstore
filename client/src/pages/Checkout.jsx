import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { HiOutlineLockClosed, HiOutlineCreditCard, HiOutlineTicket, HiOutlineX, HiOutlineCheckCircle } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../lib/motionUtils';
import toast from 'react-hot-toast';
import './Checkout.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export default function Checkout() {
  const { cartItems, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // ── Voucher state ────────────────────────────────
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherData, setVoucherData] = useState(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getDiscountedPrice = (item) => {
    return Math.round(item.price - (item.price * (item.discount || 0) / 100));
  };

  // ── Voucher helpers ───────────────────────────────
  const subtotal = getTotal();
  const voucherDiscount = (() => {
    if (!voucherData) return 0;
    if (voucherData.discount_type === 'percent') {
      return Math.round(subtotal * voucherData.discount_value / 100);
    }
    return Math.min(voucherData.discount_value, subtotal);
  })();
  const finalTotal = Math.max(0, subtotal - voucherDiscount);

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError('');
    try {
      const res = await fetch(`${API_URL}/vouchers/validate/${voucherCode.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.min_purchase > 0 && subtotal < data.min_purchase) {
        throw new Error(`Minimum pembelian ${formatPrice(data.min_purchase)} untuk voucher ini`);
      }
      setVoucherData(data);
      toast.success(`Voucher berhasil diterapkan! Hemat ${data.discount_type === 'percent' ? data.discount_value + '%' : formatPrice(data.discount_value)}`);
    } catch (err) {
      setVoucherError(err.message);
      setVoucherData(null);
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setVoucherData(null);
    setVoucherCode('');
    setVoucherError('');
  };

  const handlePayment = async () => {
    if (cartItems.length === 0) {
      toast.error('Keranjang kosong!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/payment/create-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          user_email: user.email,
          items: cartItems.map(item => ({
            id: item.game_id,
            title: item.title,
            price: getDiscountedPrice(item),
          })),
          total: finalTotal,
          voucher_code: voucherData?.code || null,
          voucher_discount: voucherDiscount || 0,
        }),
      });

      // Guard: ensure the response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from server:', text.substring(0, 200));
        throw new Error(
          `Server mengembalikan respons tidak valid (${response.status}). ` +
          `Pastikan API URL sudah benar dan server berjalan.`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat transaksi');
      }

      const orderCode = data.order_code;

      // Simpan orderCode ke localStorage untuk berjaga-jaga jika reload di mobile
      localStorage.setItem('pending_order', orderCode);

      if (window.snap) {
        window.snap.pay(data.snap_token, {
          onSuccess: async function (result) {
            // Konfirmasi ke server agar order diupdate & game masuk library
            try {
              await fetch(`${API_URL}/payment/confirm-success`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_code: orderCode }),
              });
            } catch (err) {
              console.error('Error confirming payment:', err);
            }
            localStorage.removeItem('pending_order');
            toast.success('Pembayaran berhasil!');
            clearCart();
            navigate('/library', { replace: true });
          },
          onPending: function (result) {
            toast('Silakan selesaikan pembayaran Anda.', { icon: '⏳' });
            clearCart();
            navigate('/orders', { replace: true });
          },
          onError: function (result) {
            toast.error('Pembayaran gagal');
            setLoading(false);
          },
          onClose: function () {
            toast('Pembayaran belum selesai. Anda bisa melanjutkannya nanti.', { icon: 'ℹ️' });
            setLoading(false);
          }
        });
      } else {
        throw new Error('Midtrans Snap belum dimuat. Pastikan Client Key sudah benar.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message);
      setLoading(false);
    }
  };

  // Redirect ke cart jika keranjang kosong — pakai <Navigate> bukan navigate()
  // navigate() di dalam render body menyebabkan infinite loop
  if (cartItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-hero">
        <div className="checkout-hero-glow" />
        <div className="container">
          <h1 className="checkout-title">Checkout</h1>
        </div>
      </div>

      <div className="container checkout-content">
        <motion.div 
          className="checkout-layout"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          <motion.div className="checkout-items glass-panel" variants={staggerItem}>
            <h3 className="checkout-subtitle">Item Pesanan ({cartItems.length})</h3>
            {cartItems.map(item => (
              <div key={item.game_id} className="checkout-item">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="checkout-item-img"
                  onError={(e) => {
                    if (!e.target.dataset.hasError) {
                      e.target.dataset.hasError = 'true';
                      e.target.src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="100"><rect fill="#14141F" width="80" height="100"/><text fill="#D4A853" font-family="sans-serif" font-size="10" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">${item.title.substring(0, 12)}</text></svg>`)}`;
                    }
                  }}
                />
                <div className="checkout-item-info">
                  <span className="checkout-item-title">{item.title}</span>
                  <span className="checkout-item-platform">{item.platform}</span>
                </div>
                <span className="checkout-item-price">{formatPrice(getDiscountedPrice(item))}</span>
              </div>
            ))}
          </motion.div>

          <div className="checkout-summary-container">
            <div className="checkout-payment glass-panel">
              <h3 className="checkout-subtitle">
                <HiOutlineCreditCard /> Pembayaran
              </h3>

              <div className="checkout-user-info">
                <span className="checkout-label">Email</span>
                <span className="checkout-value">{user?.email}</span>
              </div>

              {/* Voucher Input */}
              <div className="checkout-voucher">
                <label className="checkout-label" style={{ marginBottom: 8, display: 'block' }}>
                  <HiOutlineTicket style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  Kode Voucher
                </label>
                {voucherData ? (
                  <div className="voucher-applied">
                    <HiOutlineCheckCircle className="voucher-check-icon" />
                    <div className="voucher-applied-info">
                      <span className="voucher-applied-code">{voucherData.code}</span>
                      <span className="voucher-applied-desc">
                        Hemat {voucherData.discount_type === 'percent'
                          ? `${voucherData.discount_value}%`
                          : formatPrice(voucherData.discount_value)}
                      </span>
                    </div>
                    <button className="voucher-remove" onClick={removeVoucher} title="Hapus voucher">
                      <HiOutlineX />
                    </button>
                  </div>
                ) : (
                  <div className="voucher-input-row">
                    <input
                      className="voucher-input"
                      type="text"
                      placeholder="Masukkan kode voucher"
                      value={voucherCode}
                      onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(''); }}
                      onKeyDown={e => e.key === 'Enter' && applyVoucher()}
                    />
                    <button
                      className="voucher-apply-btn"
                      onClick={applyVoucher}
                      disabled={voucherLoading || !voucherCode.trim()}
                    >
                      {voucherLoading ? '...' : 'Terapkan'}
                    </button>
                  </div>
                )}
                {voucherError && <p className="voucher-error">{voucherError}</p>}
              </div>

              <div className="checkout-summary">
                <div className="checkout-row">
                  <span>Subtotal ({cartItems.length} item)</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="checkout-row">
                  <span>Biaya layanan</span>
                  <span className="text-green">Gratis</span>
                </div>
                {voucherData && (
                  <div className="checkout-row voucher-discount-row">
                    <span>Diskon Voucher ({voucherData.code})</span>
                    <span className="text-green">- {formatPrice(voucherDiscount)}</span>
                  </div>
                )}
                <div className="checkout-divider" />
                <div className="checkout-row checkout-total">
                  <span>Total Pembayaran</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg checkout-pay-btn"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                ) : (
                  <><HiOutlineLockClosed /> Bayar {formatPrice(finalTotal)}</>
                )}
              </button>

              <div className="checkout-secure">
                <HiOutlineLockClosed />
                <span>Pembayaran diproses secara aman oleh Midtrans</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

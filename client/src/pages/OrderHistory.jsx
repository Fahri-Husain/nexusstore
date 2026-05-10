import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { HiOutlineClock, HiCheckCircle, HiXCircle, HiClock, HiOutlineCollection } from 'react-icons/hi';
import { staggerContainer, staggerItem } from '../lib/motionUtils';
import toast from 'react-hot-toast';
import './OrderHistory.css';

const STATUS_MAP = {
  1: { label: 'Menunggu',   type: 'warning' },
  2: { label: 'Berhasil',   type: 'success' },
  3: { label: 'Kadaluarsa', type: 'danger'  },
  4: { label: 'Dibatalkan', type: 'danger'  },
  5: { label: 'Gagal',      type: 'danger'  },
};

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export default function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => { if (user) fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    try {
      // Cek apakah ada pending order dari pembayaran yang sukses tapi halaman ke-reload
      const pendingOrder = localStorage.getItem('pending_order');
      if (pendingOrder) {
        try {
          await fetch(`${API_URL}/payment/confirm-success`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_code: pendingOrder }),
          });
          localStorage.removeItem('pending_order');
          clearCart(); // Kosongkan keranjang karena pesanan berhasil
        } catch (err) {
          console.error('Error confirming pending order:', err);
        }
      }

      let data, error;
      try {
        const result = await supabase
          .from('orders')
          .select(`*, order_items(*, games(title, game_id, image_url))`)
          .eq('user_id', user.id)
          .eq('isdeleted', 0)
          .order('createddate', { ascending: false });
        data = result.data; error = result.error;
        if (error?.code === 'PGRST200') {
          const r2 = await supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).eq('isdeleted', 0).order('createddate', { ascending: false });
          if (r2.error) throw r2.error;
          data = r2.data; error = null;
        } else if (error) throw error;
      } catch {
        const r3 = await supabase.from('orders').select('*').eq('user_id', user.id).eq('isdeleted', 0).order('createddate', { ascending: false });
        data = r3.data;
      }
      setOrders(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Yakin ingin membatalkan pesanan ini?')) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: 4 }) // 4 = Dibatalkan
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Pesanan berhasil dibatalkan');
      fetchOrders();
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error('Gagal membatalkan pesanan');
      setLoading(false);
    }
  };

  const handleContinuePayment = (order) => {
    const snapToken = order.shipping_address;
    const orderCode = order.order_code;

    // Simpan pending order ke localStorage untuk jaga-jaga kalau page reload di mobile
    localStorage.setItem('pending_order', orderCode);

    if (window.snap) {
      window.snap.pay(snapToken, {
        onSuccess: async function (result) {
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
          
          // Hapus item yang baru dibeli dari keranjang
          if (order.order_items) {
            order.order_items.forEach(item => removeFromCart(item.game_id));
          }
          
          navigate('/library', { replace: true });
        },
        onPending: function (result) {
          toast('Silakan selesaikan pembayaran Anda.', { icon: '⏳' });
          fetchOrders();
        },
        onError: function (result) {
          toast.error('Pembayaran gagal');
          fetchOrders();
        },
        onClose: function () {
          toast('Pembayaran belum selesai.', { icon: 'ℹ️' });
          localStorage.removeItem('pending_order');
        }
      });
    } else {
      toast.error('Sistem pembayaran belum siap. Silakan refresh halaman.');
    }
  };

  const StatusBadge = ({ status }) => {
    const s = STATUS_MAP[status] || { label: 'Unknown', type: 'danger' };
    const Icon = s.type === 'success' ? HiCheckCircle : s.type === 'warning' ? HiClock : HiXCircle;
    return (
      <span className={`order-status-badge ${s.type}`}>
        <Icon /> {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <h1 className="orders-page-title">Riwayat Pesanan</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="order-skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <motion.h1
          className="orders-page-title"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Riwayat Pesanan
        </motion.h1>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <HiOutlineClock className="orders-empty-icon" />
            <h2>Belum Ada Pesanan</h2>
            <p>Riwayat pesanan akan muncul di sini setelah kamu melakukan pembelian.</p>
            <Link to="/collection" className="btn btn-primary" style={{ marginTop: 8 }}>
              Jelajahi Game
            </Link>
          </div>
        ) : (
          <motion.div
            className="orders-list"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            {orders.map(order => (
              <motion.div key={order.id} className="order-card" variants={staggerItem}>
                {/* Header */}
                <div className="order-card-header">
                  <div className="order-meta">
                    <span className="order-code">{order.order_code}</span>
                    <span className="order-date">
                      {new Date(order.createddate).toLocaleDateString('id-ID', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                {/* Items */}
                {order.order_items?.length > 0 && (
                  <div className="order-items">
                    {order.order_items.map(item => (
                      <div key={item.id} className="order-item">
                        {item.games?.image_url && (
                          <img
                            src={item.games.image_url}
                            alt=""
                            className="order-item-img"
                            onError={e => {
                              if (!e.target.dataset.hasError) {
                                e.target.dataset.hasError = 'true';
                                e.target.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="44" height="56"><rect fill="#14141F" width="44" height="56"/></svg>')}`;
                              }
                            }}
                          />
                        )}
                        <span className="order-item-title">
                          {item.games?.title || `Game #${item.game_id?.substring(0, 8)}`}
                        </span>
                        <span className="order-item-price">{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="order-card-footer">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span className="order-payment-method">
                      {order.payment_method ? `Via ${order.payment_method}` : '–'}
                    </span>
                    {order.status === 1 && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {order.shipping_address && (
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => handleContinuePayment(order)}
                          >
                            Lanjutkan Pembayaran
                          </button>
                        )}
                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          Batalkan
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="order-total">
                    Total: <strong>{formatPrice(order.total_amount)}</strong>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

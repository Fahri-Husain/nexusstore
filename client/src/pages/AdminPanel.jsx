import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
  HiOutlineShieldCheck, HiOutlineViewGrid, HiOutlineCollection,
  HiOutlineClipboardList, HiOutlineHome, HiOutlineRefresh,
  HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineStar,
  HiOutlineSearch, HiOutlineFilter, HiOutlineDownload, HiOutlineDocumentText,
  HiOutlineChartBar, HiOutlineExclamationCircle, HiOutlineTicket,
} from 'react-icons/hi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const STATUS_MAP = {
  1: { label: 'Menunggu', type: 'warning' },
  2: { label: 'Berhasil', type: 'success' },
  3: { label: 'Kadaluarsa', type: 'danger' },
  4: { label: 'Dibatalkan', type: 'danger' },
  5: { label: 'Gagal', type: 'danger' },
};

export default function AdminPanel() {
  const [games, setGames] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // ── Voucher State ────────────────────────────────
  const [vouchers, setVouchers] = useState([]);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherForm, setVoucherForm] = useState({
    code: '', description: '', discount_type: 'percent', discount_value: 10,
    min_purchase: 0, max_uses: '', expired_at: '', is_active: true,
  });

  // ── Order Filters ────────────────────────────────
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', price: 0, discount: 0,
    image_url: '', category: '', developer: '', publisher: '',
    release_date: '', platform: 'PC', rating: 4.0,
    min_requirements: '', rec_requirements: '',
  });

  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const gamesRes = await supabase.from('games').select('*').eq('isdeleted', 0).order('createddate', { ascending: false });
      setGames(gamesRes.data || []);

      // Fetch orders via backend to bypass RLS on order_items
      let ordersData = [];
      try {
        const response = await fetch(`${API_URL}/orders/admin/all`);
        if (!response.ok) throw new Error('Gagal mengambil pesanan dari server');
        ordersData = await response.json();
      } catch (err) {
        console.error('Fetch orders API error:', err);
        // Fallback to supabase direct fetch if backend is not accessible
        const fallbackRes = await supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('isdeleted', 0)
          .order('createddate', { ascending: false })
          .limit(50);
        ordersData = fallbackRes.data || [];
      }
      setOrders(ordersData);
    } catch (error) {
      console.error('Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingGame(null);
    setFormData({
      title: '', description: '', price: 0, discount: 0,
      image_url: '', category: '', developer: '', publisher: '',
      release_date: '', platform: 'PC', rating: 4.0,
      min_requirements: '', rec_requirements: '',
    });
    setShowModal(true);
  };

  const openEditModal = (game) => {
    setEditingGame(game);
    setFormData({
      title: game.title,
      description: game.description || '',
      price: game.price,
      discount: game.discount || 0,
      image_url: game.image_url || '',
      category: game.category || '',
      developer: game.developer || '',
      publisher: game.publisher || '',
      release_date: game.release_date || '',
      platform: game.platform || 'PC',
      rating: game.rating || 4.0,
      min_requirements: game.min_requirements || '',
      rec_requirements: game.rec_requirements || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const gameData = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      discount: parseFloat(formData.discount),
      image_url: formData.image_url,
      category: formData.category,
      developer: formData.developer,
      publisher: formData.publisher,
      release_date: formData.release_date || null,
      platform: formData.platform,
      rating: parseFloat(formData.rating),
      min_requirements: formData.min_requirements,
      rec_requirements: formData.rec_requirements,
      lastupdateddate: new Date().toISOString(),
    };

    try {
      if (editingGame) {
        const response = await fetch(`${API_URL}/games/admin/${editingGame.game_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData)
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Gagal memperbarui game');
        }
        toast.success('Game berhasil diperbarui!');
      } else {
        const response = await fetch(`${API_URL}/games/admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gameData)
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Gagal menambahkan game');
        }
        toast.success('Game berhasil ditambahkan!');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDelete = (gameId, title) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Game',
      message: `Yakin ingin menghapus game "${title}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/games/admin/${gameId}`, {
            method: 'DELETE'
          });
          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Gagal menghapus game');
          }
          toast.success('Game berhasil dihapus');
          fetchData();
        } catch (error) {
          toast.error(error.message);
        }
      }
    });
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase.from('orders').update({ status: parseInt(newStatus), lastupdateddate: new Date().toISOString() }).eq('id', orderId);
      if (error) throw error;
      toast.success('Status pesanan berhasil diperbarui');
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeleteOrder = (orderId, orderCode) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pesanan',
      message: `Yakin ingin menghapus pesanan dengan kode ${orderCode}? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('orders').update({ isdeleted: 1, lastupdateddate: new Date().toISOString() }).eq('id', orderId);
          if (error) throw error;
          toast.success('Order berhasil dihapus');
          fetchData();
        } catch (error) {
          toast.error(error.message);
        }
      }
    });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  // ── Filtered Orders ──────────────────────────────
  const filteredOrders = orders.filter(order => {
    const searchLower = orderSearch.toLowerCase();
    const matchSearch = !orderSearch ||
      (order.order_code || '').toLowerCase().includes(searchLower) ||
      (order.user_email || '').toLowerCase().includes(searchLower) ||
      (order.payment_method || '').toLowerCase().includes(searchLower);

    const matchStatus = orderStatus === 'all' || String(order.status) === orderStatus;

    const orderDate = order.createddate ? new Date(order.createddate) : null;
    const matchFrom = !orderDateFrom || (orderDate && orderDate >= new Date(orderDateFrom));
    const matchTo = !orderDateTo || (orderDate && orderDate <= new Date(orderDateTo + 'T23:59:59'));

    return matchSearch && matchStatus && matchFrom && matchTo;
  });

  // ── Export CSV ───────────────────────────────────
  const exportCSV = () => {
    const headers = ['Order Code', 'Tanggal', 'Items', 'Total', 'Status', 'Metode'];
    const rows = filteredOrders.map(o => [
      o.order_code || '',
      o.createddate ? new Date(o.createddate).toLocaleDateString('id-ID') : '',
      (o.order_items?.length || 0) + ' item',
      o.total_amount || 0,
      (STATUS_MAP[o.status] || {}).label || 'Unknown',
      o.payment_method || '-',
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filteredOrders.length} order diekspor ke Excel/CSV`);
  };

  // ── Export PDF (print) ───────────────────────────
  const exportPDF = () => {
    const printRows = filteredOrders.map(o => `
      <tr>
        <td>${o.order_code || ''}</td>
        <td>${o.createddate ? new Date(o.createddate).toLocaleDateString('id-ID') : ''}</td>
        <td>${o.order_items?.length || 0} item</td>
        <td>${formatPrice(o.total_amount)}</td>
        <td>${(STATUS_MAP[o.status] || {}).label || 'Unknown'}</td>
        <td>${o.payment_method || '-'}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Orders Report — Nexus Store</title>
      <style>
        body { font-family: sans-serif; font-size: 12px; color: #111; }
        h2 { margin-bottom: 8px; }
        p { color: #666; margin-bottom: 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 7px 10px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        tr:nth-child(even) td { background: #fafafa; }
      </style></head><body>
      <h2>Laporan Orders — Nexus Store</h2>
      <p>Dicetak: ${new Date().toLocaleString('id-ID')} | Total: ${filteredOrders.length} pesanan</p>
      <table><thead><tr>
        <th>Order Code</th><th>Tanggal</th><th>Items</th><th>Total</th><th>Status</th><th>Metode</th>
      </tr></thead><tbody>${printRows}</tbody></table>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const resetFilters = () => {
    setOrderSearch('');
    setOrderStatus('all');
    setOrderDateFrom('');
    setOrderDateTo('');
  };
  const hasActiveFilters = orderSearch || orderStatus !== 'all' || orderDateFrom || orderDateTo;


  const totalRevenue = orders.filter(o => o.status === 2).reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const successOrders = orders.filter(o => o.status === 2).length;
  const pendingOrders = orders.filter(o => o.status === 1).length;

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <HiOutlineViewGrid /> },
    { key: 'games', label: 'Games', icon: <HiOutlineCollection /> },
    { key: 'orders', label: 'Orders', icon: <HiOutlineClipboardList /> },
    { key: 'vouchers', label: 'Voucher', icon: <HiOutlineTicket /> },
    { key: 'laporan', label: 'Laporan Penjualan', icon: <HiOutlineChartBar /> },
  ];

  // ── Helper: get item count robustly (works even if RLS blocked) ────
  const getItemCount = (order) => {
    if (Array.isArray(order.order_items) && order.order_items.length > 0) {
      return order.order_items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    }
    // If order_items empty due to RLS, show '-' so admin knows data is missing
    return null;
  };

  // ── Laporan Penjualan computed data ───────────────────
  const successOrdersList = orders.filter(o => o.status === 2);
  const totalItems = successOrdersList.reduce((sum, o) => sum + (o.order_items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0), 0);

  // Group revenue by month
  const revenueByMonth = successOrdersList.reduce((acc, o) => {
    if (!o.createddate) return acc;
    const month = new Date(o.createddate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + (o.total_amount || 0);
    return acc;
  }, {});
  const monthKeys = Object.keys(revenueByMonth).slice(-6); // last 6 months
  const chartData = monthKeys.map(month => ({
    name: month,
    Pendapatan: revenueByMonth[month],
  }));

  // Top selling games from order_items
  const gameSalesMap = {};
  successOrdersList.forEach(o => {
    (o.order_items || []).forEach(item => {
      const title = item.games?.title || `Game #${(item.game_id || '').substring(0, 6)}`;
      const img = item.games?.image_url || '';
      if (!gameSalesMap[title]) gameSalesMap[title] = { title, img, qty: 0, revenue: 0 };
      gameSalesMap[title].qty += item.quantity || 1;
      gameSalesMap[title].revenue += item.price || 0;
    });
  });
  const topGames = Object.values(gameSalesMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const exportLaporanCSV = () => {
    const headers = ['Rank', 'Game', 'Qty Terjual', 'Total Pendapatan'];
    const rows = topGames.map((g, i) => [
      i + 1,
      g.title || '',
      g.qty + ' unit',
      g.revenue
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-penjualan-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Laporan diekspor ke Excel/CSV');
  };

  const exportLaporanPDF = () => {
    const printRows = topGames.map((g, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${g.title || ''}</td>
        <td>${g.qty} unit</td>
        <td>${formatPrice(g.revenue)}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Laporan Penjualan — Nexus Store</title>
      <style>
        body { font-family: sans-serif; font-size: 12px; color: #111; }
        h2 { margin-bottom: 8px; }
        p { color: #666; margin-bottom: 16px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 7px 10px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        tr:nth-child(even) td { background: #fafafa; }
        .summary { display: flex; gap: 20px; margin-bottom: 20px; }
        .summary-box { border: 1px solid #ddd; padding: 15px; border-radius: 4px; flex: 1; }
      </style></head><body>
      <h2>Laporan Penjualan — Nexus Store</h2>
      <p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>
      
      <div class="summary">
        <div class="summary-box">
          <strong>Total Pendapatan:</strong><br/>
          <span style="font-size: 16px; color: #D4A853;">${formatPrice(totalRevenue)}</span>
        </div>
        <div class="summary-box">
          <strong>Order Berhasil:</strong><br/>
          <span style="font-size: 16px;">${successOrders}</span>
        </div>
        <div class="summary-box">
          <strong>Total Item Terjual:</strong><br/>
          <span style="font-size: 16px;">${totalItems}</span>
        </div>
      </div>

      <h3>Game Terlaris (Top ${topGames.length})</h3>
      <table><thead><tr>
        <th>Rank</th><th>Game</th><th>Qty Terjual</th><th>Total Pendapatan</th>
      </tr></thead><tbody>${printRows}</tbody></table>
      </body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  // ── Voucher CRUD handlers ─────────────────────────────
  const fetchVouchers = async () => {
    try {
      const res = await fetch(`${API_URL}/vouchers`);
      const data = await res.json();
      setVouchers(data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeTab === 'vouchers') fetchVouchers();
  }, [activeTab]);

  const openAddVoucher = () => {
    setEditingVoucher(null);
    setVoucherForm({ code: '', description: '', discount_type: 'percent', discount_value: 10, min_purchase: 0, max_uses: '', expired_at: '', is_active: true });
    setShowVoucherModal(true);
  };

  const openEditVoucher = (v) => {
    setEditingVoucher(v);
    setVoucherForm({
      code: v.code || '',
      description: v.description || '',
      discount_type: v.discount_type || 'percent',
      discount_value: v.discount_value || 0,
      min_purchase: v.min_purchase || 0,
      max_uses: v.max_uses ?? '',
      expired_at: v.expired_at ? v.expired_at.slice(0, 16) : '',
      is_active: v.is_active ?? true,
    });
    setShowVoucherModal(true);
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    const body = {
      ...voucherForm,
      discount_value: parseFloat(voucherForm.discount_value),
      min_purchase: parseFloat(voucherForm.min_purchase) || 0,
      max_uses: voucherForm.max_uses !== '' ? parseInt(voucherForm.max_uses) : null,
      expired_at: voucherForm.expired_at || null,
    };
    try {
      const url = editingVoucher ? `${API_URL}/vouchers/${editingVoucher.id}` : `${API_URL}/vouchers`;
      const method = editingVoucher ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success(editingVoucher ? 'Voucher berhasil diperbarui!' : 'Voucher berhasil dibuat!');
      setShowVoucherModal(false);
      fetchVouchers();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteVoucher = (id, code) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Voucher',
      message: `Yakin ingin menghapus voucher "${code}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/vouchers/${id}`, { method: 'DELETE' });
          if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
          toast.success('Voucher berhasil dihapus');
          fetchVouchers();
        } catch (err) { toast.error(err.message); }
      }
    });
  };

  return (
    <div className="admin-shell">
      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div className="admin-sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-logo">
          <HiOutlineShieldCheck className="admin-sidebar-logo-icon" />
          <span>Admin Panel</span>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`admin-sidebar-item ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-sidebar-item">
            <HiOutlineHome />
            <span>Kembali ke Toko</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <button className="admin-topbar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span /><span /><span />
          </button>
          <div className="admin-topbar-title">
            {navItems.find(i => i.key === activeTab)?.label || 'Admin'}
          </div>
          <button className="admin-topbar-refresh" onClick={fetchData} title="Refresh data">
            <HiOutlineRefresh />
          </button>
        </header>

        <div className="admin-content">

          {/* ─── DASHBOARD ─── */}
          {activeTab === 'dashboard' && (
            <div className="animate-fadeIn">
              <div className="admin-stat-grid">
                <div className="admin-stat-card">
                  <div className="admin-stat-icon games-icon">
                    <HiOutlineCollection />
                  </div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Total Game</span>
                    <span className="admin-stat-value">{games.length}</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon orders-icon">
                    <HiOutlineShoppingCart />
                  </div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Total Orders</span>
                    <span className="admin-stat-value">{orders.length}</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon success-icon">
                    <HiOutlineStar />
                  </div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Order Berhasil</span>
                    <span className="admin-stat-value">{successOrders}</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon revenue-icon">
                    <HiOutlineCurrencyDollar />
                  </div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Total Pendapatan</span>
                    <span className="admin-stat-value admin-stat-revenue">{formatPrice(totalRevenue)}</span>
                  </div>
                </div>
              </div>

              <div className="admin-dashboard-tables">
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3>Game Terbaru</h3>
                    <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('games')}>Lihat Semua</button>
                  </div>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Game</th>
                          <th>Harga</th>
                          <th>Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {games.slice(0, 5).map(game => (
                          <tr key={game.game_id}>
                            <td>
                              <div className="admin-game-cell">
                                <img src={game.image_url} alt="" className="admin-game-thumb"
                                  onError={(e) => { if (!e.target.dataset.hasError) { e.target.dataset.hasError = 'true'; e.target.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"><rect fill="#14141F" width="40" height="50"/><text fill="#D4A853" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">G</text></svg>')}`; }}} />
                                <div>
                                  <span className="admin-game-title">{game.title}</span>
                                  <span className="admin-game-slug">{game.platform}</span>
                                </div>
                              </div>
                            </td>
                            <td>{formatPrice(game.price)}</td>
                            <td>⭐ {Number(game.rating).toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="admin-card">
                  <div className="admin-card-header">
                    <h3>Order Terbaru</h3>
                    <button className="btn btn-outline btn-sm" onClick={() => setActiveTab('orders')}>Lihat Semua</button>
                  </div>
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Order Code</th>
                          <th>Total</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.slice(0, 5).map(order => (
                          <tr key={order.id}>
                            <td><code className="admin-code">{order.order_code}</code></td>
                            <td>{formatPrice(order.total_amount)}</td>
                            <td>
                              <span className={`badge badge-${(STATUS_MAP[order.status] || {}).type || 'danger'}`}>
                                {(STATUS_MAP[order.status] || {}).label || 'Unknown'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── GAMES ─── */}
          {activeTab === 'games' && (
            <div className="animate-fadeIn">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Daftar Game <span className="admin-badge-count">{games.length}</span></h3>
                  <button className="btn btn-primary btn-sm" onClick={openAddModal}>
                    <HiOutlinePlus /> Tambah Game
                  </button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Aksi</th>
                        <th>Game</th>
                        <th>Harga</th>
                        <th>Diskon</th>
                        <th>Rating</th>
                        <th>Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" className="admin-table-empty">Memuat data...</td></tr>
                      ) : games.length === 0 ? (
                        <tr><td colSpan="6" className="admin-table-empty">Belum ada game</td></tr>
                      ) : games.map(game => (
                        <tr key={game.game_id}>
                          <td>
                            <div className="admin-actions">
                              <button className="btn btn-outline btn-sm" onClick={() => openEditModal(game)} title="Edit">
                                <HiOutlinePencil />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(game.game_id, game.title)} title="Hapus">
                                <HiOutlineTrash />
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="admin-game-cell">
                              <img src={game.image_url} alt="" className="admin-game-thumb"
                                onError={(e) => { if (!e.target.dataset.hasError) { e.target.dataset.hasError = 'true'; e.target.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="50"><rect fill="#14141F" width="40" height="50"/><text fill="#D4A853" font-family="sans-serif" font-size="14" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">G</text></svg>')}`; }}} />
                              <div>
                                <span className="admin-game-title">{game.title}</span>
                                <span className="admin-game-slug">{game.platform}</span>
                              </div>
                            </div>
                          </td>
                          <td>{formatPrice(game.price)}</td>
                          <td>{game.discount > 0 ? <span className="badge badge-warning">{game.discount}%</span> : <span className="text-muted">-</span>}</td>
                          <td>⭐ {Number(game.rating).toFixed(1)}</td>
                          <td>{game.category ? <span className="admin-category-tag">{game.category}</span> : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── ORDERS ─── */}
          {activeTab === 'orders' && (
            <div className="animate-fadeIn">
              <div className="admin-orders-summary">
                <div className="admin-order-pill pending">
                  <span>{filteredOrders.filter(o => o.status === 1).length}</span> Menunggu
                </div>
                <div className="admin-order-pill success">
                  <span>{filteredOrders.filter(o => o.status === 2).length}</span> Berhasil
                </div>
                <div className="admin-order-pill total">
                  <span>{filteredOrders.length}</span>
                  {hasActiveFilters ? 'Hasil Filter' : 'Total'}
                </div>
              </div>

              {/* Export buttons — outside the filter card */}
              <div className="admin-filter-exports-row">
                <button className="btn btn-outline btn-sm" onClick={exportCSV} title="Export ke Excel/CSV">
                  <HiOutlineDownload /> Excel
                </button>
                <button className="btn btn-outline btn-sm" onClick={exportPDF} title="Export ke PDF">
                  <HiOutlineDocumentText /> PDF
                </button>
              </div>

              {/* Filter card */}
              <div className="admin-filter-bar">
                <div className="admin-filter-search">
                  <HiOutlineSearch className="admin-filter-icon" />
                  <input
                    type="text"
                    className="admin-filter-input"
                    placeholder="Cari order code, email, metode..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                  />
                </div>

                <div className="admin-filter-group">
                  <HiOutlineFilter className="admin-filter-icon-sm" />
                  <select
                    className="admin-filter-select"
                    value={orderStatus}
                    onChange={e => setOrderStatus(e.target.value)}
                  >
                    <option value="all">Semua Status</option>
                    <option value="1">Menunggu</option>
                    <option value="2">Berhasil</option>
                    <option value="3">Kadaluarsa</option>
                    <option value="4">Dibatalkan</option>
                    <option value="5">Gagal</option>
                  </select>
                </div>

                <div className="admin-filter-group">
                  <label className="admin-filter-label">Dari</label>
                  <input
                    type="date"
                    className="admin-filter-date"
                    value={orderDateFrom}
                    onChange={e => setOrderDateFrom(e.target.value)}
                  />
                </div>

                <div className="admin-filter-group">
                  <label className="admin-filter-label">Sampai</label>
                  <input
                    type="date"
                    className="admin-filter-date"
                    value={orderDateTo}
                    onChange={e => setOrderDateTo(e.target.value)}
                  />
                </div>

                {hasActiveFilters && (
                  <button className="admin-filter-reset" onClick={resetFilters}>
                    <HiOutlineX /> Reset
                  </button>
                )}
              </div>


              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>
                    Pesanan
                    <span className="admin-badge-count">{filteredOrders.length}</span>
                    {hasActiveFilters && <span className="admin-filter-active-tag">Terfilter</span>}
                  </h3>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Aksi</th>
                        <th>Order Code</th>
                        <th>Tanggal</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Metode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" className="admin-table-empty">Memuat data...</td></tr>
                      ) : filteredOrders.length === 0 ? (
                        <tr><td colSpan="6" className="admin-table-empty">
                          {hasActiveFilters ? '🔍 Tidak ada pesanan yang sesuai filter' : 'Belum ada pesanan'}
                        </td></tr>
                      ) : filteredOrders.map(order => (
                        <tr key={order.id}>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteOrder(order.id, order.order_code)} title="Hapus Order">
                              <HiOutlineTrash />
                            </button>
                          </td>
                          <td><code className="admin-code">{order.order_code}</code></td>
                          <td className="text-sm">{new Date(order.createddate).toLocaleDateString('id-ID')}</td>
                          <td>
                            {(() => {
                              const count = getItemCount(order);
                              return count !== null
                                ? <span>{count} item</span>
                                : <span className="text-muted" title="Data item tidak tersedia (RLS)">–</span>;
                            })()}
                          </td>
                          <td><strong>{formatPrice(order.total_amount)}</strong></td>
                          <td>
                            <span className={`badge badge-${(STATUS_MAP[order.status] || {}).type || 'danger'}`}>
                              {(STATUS_MAP[order.status] || {}).label || 'Unknown'}
                            </span>
                          </td>
                          <td>{order.payment_method || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── LAPORAN PENJUALAN ─── */}
          {activeTab === 'laporan' && (
            <div className="animate-fadeIn">
              <div className="admin-filter-exports-row" style={{ marginBottom: 'var(--spacing-md)' }}>
                <button className="btn btn-outline btn-sm" onClick={exportLaporanCSV} title="Export ke Excel/CSV">
                  <HiOutlineDownload /> Excel
                </button>
                <button className="btn btn-outline btn-sm" onClick={exportLaporanPDF} title="Export ke PDF">
                  <HiOutlineDocumentText /> PDF
                </button>
              </div>

              {/* Summary stats */}
              <div className="admin-stat-grid" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon revenue-icon"><HiOutlineCurrencyDollar /></div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Total Pendapatan</span>
                    <span className="admin-stat-value admin-stat-revenue">{formatPrice(totalRevenue)}</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon success-icon"><HiOutlineStar /></div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Order Berhasil</span>
                    <span className="admin-stat-value">{successOrders}</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon orders-icon"><HiOutlineShoppingCart /></div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Total Item Terjual</span>
                    <span className="admin-stat-value">{totalItems > 0 ? totalItems : '–'}</span>
                  </div>
                </div>
                <div className="admin-stat-card">
                  <div className="admin-stat-icon games-icon"><HiOutlineCollection /></div>
                  <div className="admin-stat-body">
                    <span className="admin-stat-label">Rata-rata / Order</span>
                    <span className="admin-stat-value admin-stat-revenue">
                      {successOrders > 0 ? formatPrice(Math.round(totalRevenue / successOrders)) : '–'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue by Month chart */}
              <div className="admin-card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div className="admin-card-header">
                  <h3>Pendapatan per Bulan <span className="admin-badge-count">{monthKeys.length} bulan</span></h3>
                </div>
                <div className="admin-chart-area" style={{ height: 320, padding: '24px 16px' }}>
                  {monthKeys.length === 0 ? (
                    <div className="admin-table-empty">Belum ada data pendapatan</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="rgba(255,255,255,0.3)" 
                          tick={{fill: 'rgba(255,255,255,0.6)', fontSize: 12}} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="rgba(255,255,255,0.3)" 
                          tick={{fill: 'rgba(255,255,255,0.6)', fontSize: 12}} 
                          tickFormatter={(value) => `Rp ${(value/1000).toLocaleString('id-ID')}k`} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          cursor={{fill: 'rgba(255,255,255,0.03)'}}
                          contentStyle={{ backgroundColor: '#14151C', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}
                          itemStyle={{ color: '#F0F0F5', fontWeight: 'bold' }}
                          formatter={(value) => [formatPrice(value), 'Pendapatan']}
                        />
                        <Bar dataKey="Pendapatan" fill="url(#colorRevenue)" radius={[6, 6, 0, 0]} maxBarSize={60} />
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#D4A853" stopOpacity={1}/>
                            <stop offset="100%" stopColor="#D4A853" stopOpacity={0.6}/>
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top Games */}
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Game Terlaris <span className="admin-badge-count">Top {topGames.length}</span></h3>
                </div>
                {topGames.length === 0 ? (
                  <div className="admin-table-empty" style={{ padding: 32 }}>
                    {orders.some(o => o.status === 2) ? 'Data item belum tersedia (server perlu di-restart)' : 'Belum ada penjualan'}
                  </div>
                ) : (
                  <div className="admin-table-wrapper">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Game</th>
                          <th>Qty Terjual</th>
                          <th>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topGames.map((g, i) => (
                          <tr key={g.title}>
                            <td><span className="admin-rank-badge">{i + 1}</span></td>
                            <td>
                              <div className="admin-game-cell">
                                {g.img && (
                                  <img src={g.img} alt="" className="admin-game-thumb"
                                    onError={(e) => { if (!e.target.dataset.hasError) { e.target.dataset.hasError = 'true'; e.target.style.display = 'none'; }}} />
                                )}
                                <span className="admin-game-title">{g.title}</span>
                              </div>
                            </td>
                            <td><strong>{g.qty}</strong> unit</td>
                            <td><strong>{formatPrice(g.revenue)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── VOUCHERS ─── */}
          {activeTab === 'vouchers' && (
            <div className="animate-fadeIn">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Daftar Voucher <span className="admin-badge-count">{vouchers.length}</span></h3>
                  <button className="btn btn-primary btn-sm" onClick={openAddVoucher}>
                    <HiOutlinePlus /> Tambah Voucher
                  </button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Aksi</th>
                        <th>Kode</th>
                        <th>Deskripsi</th>
                        <th>Diskon</th>
                        <th>Min. Pembelian</th>
                        <th>Penggunaan</th>
                        <th>Expired</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vouchers.length === 0 ? (
                        <tr><td colSpan="8" className="admin-table-empty">Belum ada voucher</td></tr>
                      ) : vouchers.map(v => (
                        <tr key={v.id}>
                          <td>
                            <div className="admin-actions">
                              <button className="btn btn-outline btn-sm" onClick={() => openEditVoucher(v)} title="Edit">
                                <HiOutlinePencil />
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteVoucher(v.id, v.code)} title="Hapus">
                                <HiOutlineTrash />
                              </button>
                            </div>
                          </td>
                          <td><code className="admin-code">{v.code}</code></td>
                          <td className="text-sm">{v.description || '-'}</td>
                          <td>
                            <span className="badge badge-warning">
                              {v.discount_type === 'percent' ? `${v.discount_value}%` : formatPrice(v.discount_value)}
                            </span>
                          </td>
                          <td>{v.min_purchase > 0 ? formatPrice(v.min_purchase) : '-'}</td>
                          <td>{v.used_count ?? 0} / {v.max_uses ?? '∞'}</td>
                          <td className="text-sm">
                            {v.expired_at ? new Date(v.expired_at).toLocaleDateString('id-ID') : '–'}
                          </td>
                          <td>
                            <span className={`badge badge-${v.is_active ? 'success' : 'danger'}`}>
                              {v.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ─── CONFIRM MODAL ─── */}
      {confirmModal.isOpen && (
        <div className="modal-overlay" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
          <div className="modal-content confirm-modal animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <HiOutlineExclamationCircle />
            </div>
            <h3>{confirmModal.title}</h3>
            <p className="confirm-desc">{confirmModal.message}</p>
            <div className="confirm-actions">
              <button type="button" className="btn-confirm-cancel" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>
                Batal
              </button>
              <button type="button" className="btn-confirm-danger" onClick={() => {
                confirmModal.onConfirm();
                setConfirmModal({ ...confirmModal, isOpen: false });
              }}>
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL ─── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingGame ? 'Edit Game' : 'Tambah Game Baru'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <HiOutlineX />
              </button>
            </div>

            <form className="modal-form" onSubmit={handleSubmit}>
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Judul *</label>
                  <input className="form-input" required value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <input className="form-input" placeholder="Action, RPG, dll" value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Harga (IDR) *</label>
                  <input className="form-input" type="number" required value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Diskon (%)</label>
                  <input className="form-input" type="number" min="0" max="100" value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cover Image URL</label>
                  <input className="form-input" value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform</label>
                  <select className="form-input" value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}>
                    <option value="PC">PC</option>
                    <option value="PS5">PS5</option>
                    <option value="PS4">PS4</option>
                    <option value="Xbox Series X">Xbox Series X</option>
                    <option value="Xbox One">Xbox One</option>
                    <option value="Nintendo Switch">Nintendo Switch</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Developer</label>
                  <input className="form-input" value={formData.developer}
                    onChange={(e) => setFormData({ ...formData, developer: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Publisher</label>
                  <input className="form-input" value={formData.publisher}
                    onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tanggal Rilis</label>
                  <input className="form-input" type="date" value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Rating (0-5)</label>
                  <input className="form-input" type="number" step="0.1" min="0" max="5" value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })} />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" rows={3} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Minimum Requirements</label>
                <textarea className="form-input" rows={2} value={formData.min_requirements}
                  onChange={(e) => setFormData({ ...formData, min_requirements: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Recommended Requirements</label>
                <textarea className="form-input" rows={2} value={formData.rec_requirements}
                  onChange={(e) => setFormData({ ...formData, rec_requirements: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  {editingGame ? 'Simpan Perubahan' : 'Tambah Game'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VOUCHER MODAL ─── */}
      {showVoucherModal && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(false)}>
          <div className="modal-content animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingVoucher ? 'Edit Voucher' : 'Tambah Voucher Baru'}</h2>
              <button className="modal-close" onClick={() => setShowVoucherModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form className="modal-form" onSubmit={handleVoucherSubmit}>
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Kode Voucher *</label>
                  <input className="form-input" required placeholder="contoh: NEXUS10"
                    value={voucherForm.code}
                    onChange={e => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tipe Diskon</label>
                  <select className="form-input" value={voucherForm.discount_type}
                    onChange={e => setVoucherForm({ ...voucherForm, discount_type: e.target.value })}>
                    <option value="percent">Persen (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nilai Diskon *</label>
                  <input className="form-input" type="number" required min="0" step="0.01"
                    placeholder={voucherForm.discount_type === 'percent' ? 'contoh: 10' : 'contoh: 50000'}
                    value={voucherForm.discount_value}
                    onChange={e => setVoucherForm({ ...voucherForm, discount_value: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Min. Pembelian (Rp)</label>
                  <input className="form-input" type="number" min="0" placeholder="0 = tidak ada minimum"
                    value={voucherForm.min_purchase}
                    onChange={e => setVoucherForm({ ...voucherForm, min_purchase: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Maks. Penggunaan</label>
                  <input className="form-input" type="number" min="1" placeholder="Kosongkan = tidak terbatas"
                    value={voucherForm.max_uses}
                    onChange={e => setVoucherForm({ ...voucherForm, max_uses: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Berlaku Hingga</label>
                  <input className="form-input" type="datetime-local"
                    value={voucherForm.expired_at}
                    onChange={e => setVoucherForm({ ...voucherForm, expired_at: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input" value={voucherForm.is_active ? 'true' : 'false'}
                    onChange={e => setVoucherForm({ ...voucherForm, is_active: e.target.value === 'true' })}>
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">Deskripsi</label>
                <textarea className="form-input" rows={2} placeholder="Keterangan singkat tentang voucher ini..."
                  value={voucherForm.description}
                  onChange={e => setVoucherForm({ ...voucherForm, description: e.target.value })}
                  style={{ resize: 'vertical' }} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowVoucherModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  {editingVoucher ? 'Simpan Perubahan' : 'Buat Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

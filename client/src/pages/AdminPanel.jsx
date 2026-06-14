 import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
  HiOutlineShieldCheck, HiOutlineViewGrid, HiOutlineCollection,
  HiOutlineClipboardList, HiOutlineHome, HiOutlineRefresh,
  HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineStar,
  HiOutlineSearch, HiOutlineFilter, HiOutlineDownload, HiOutlineDocumentText,
  HiOutlineChartBar, HiOutlineExclamationCircle, HiOutlineTicket, HiOutlinePhotograph, HiOutlineUsers, HiOutlineSpeakerphone, HiOutlineBan, HiOutlineCheckCircle,
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
  const [adminUser, setAdminUser] = useState('Admin');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // ── Voucher State ────────────────────────────────
  
  
  // ── Users & Broadcast State ──────────────────────
  const [usersList, setUsersList] = useState([]);
  
  const [broadcasts, setBroadcasts] = useState([]);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [editingBroadcast, setEditingBroadcast] = useState(null);
  const [broadcastForm, setBroadcastForm] = useState({ message: '', type: 'info', is_active: true });

  // ── Banner State ─────────────────────────────────
  const [banners, setBanners] = useState([]);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', image_url: '', target_url: '', is_active: true
  });

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
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) setAdminUser(data.user.email);
    };
    fetchUser();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const gamesRes = await supabase.from('games').select('*').eq('isdeleted', 0).order('createddate', { ascending: false });
      setGames(gamesRes.data || []);

      
      const usersRes = await fetch(`${API_URL}/users/admin`).then(r => r.json()).catch(() => []);
      setUsersList(Array.isArray(usersRes) ? usersRes : []);

      const broadcastRes = await fetch(`${API_URL}/broadcasts/admin`).then(r => r.json()).catch(() => []);
      setBroadcasts(Array.isArray(broadcastRes) ? broadcastRes : []);

      const bannersRes = await fetch(`${API_URL}/banners/admin`).then(r => r.json()).catch(() => []);
      setBanners(Array.isArray(bannersRes) ? bannersRes : []);


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
      is_carousel: false, logo_url: '', hero_image_url: '', detail_image_url: ''
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
      is_carousel: game.is_carousel || false,
      logo_url: game.logo_url || '',
      hero_image_url: game.hero_image_url || '',
      detail_image_url: game.detail_image_url || ''
    });
    setShowModal(true);
  };



  const handleDetailImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const webpBlob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Gagal mengkonversi gambar ke .webp'));
            }, 'image/webp', 0.85);
          };
          img.onerror = () => reject(new Error('Gagal memuat gambar'));
          img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
      });

      const fileName = `detail_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { data, error } = await supabase.storage.from('Game-Img').upload(fileName, webpBlob, { contentType: 'image/webp', cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('Game-Img').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, detail_image_url: publicUrl }));
      toast.success('Detail Image berhasil diunggah!');
    } catch (err) {
      console.error('Upload detail img error:', err);
      toast.error(err.message || 'Gagal mengunggah gambar detail');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const fileName = `hero_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage.from('Game-Img').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('Game-Img').getPublicUrl(fileName);
      setFormData(prev => ({ ...prev, hero_image_url: publicUrl }));
      toast.success('Background Carousel berhasil diunggah!');
    } catch (err) {
      console.error('Upload hero bg error:', err);
      toast.error(err.message || 'Gagal mengunggah background');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${file.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('Game-Img')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Game-Img')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo berhasil diunggah!');
    } catch (err) {
      console.error('Upload logo error:', err);
      toast.error(err.message || 'Gagal mengunggah logo');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      
      const webpBlob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Gagal mengkonversi gambar ke .webp'));
            }, 'image/webp', 0.85);
          };
          img.onerror = () => reject(new Error('Gagal memuat gambar'));
          img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
      });

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { data, error } = await supabase.storage
        .from('Game-Img')
        .upload(fileName, webpBlob, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('Game-Img')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Gambar berhasil diunggah!');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err.message || 'Gagal mengunggah gambar');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
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
      is_carousel: formData.is_carousel,
      logo_url: formData.logo_url,
      hero_image_url: formData.hero_image_url,
      detail_image_url: formData.detail_image_url,
      lastupdateddate: new Date().toISOString(),
      createdby: editingGame ? editingGame.createdby : adminUser,
      lastupdatedby: adminUser,
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

  // Helper function for PDF generation
  const generatePdfAndPreview = async (htmlContent, title) => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    const toastId = toast.loading('Membuat PDF...');
    try {
      const printContainer = document.createElement('div');
      printContainer.innerHTML = htmlContent;
      Object.assign(printContainer.style, {
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        width: '210mm',
        backgroundColor: '#fff',
        padding: '15mm',
        boxSizing: 'border-box'
      });
      document.body.appendChild(printContainer);

      await new Promise(r => setTimeout(r, 500)); // wait for rendering

      const canvas = await html2canvas(printContainer, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      setPdfPreviewUrl(pdfUrl);
      setPdfPreviewTitle(title);
      
      document.body.removeChild(printContainer);
      toast.dismiss(toastId);
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat PDF');
      toast.dismiss(toastId);
    } finally {
      setIsGeneratingPdf(false);
    }
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
      <title>Laporan Orders</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; font-size: 12px; color: #111; margin: 0; background-color: #fff; padding-bottom: 20px; }
        .header { display: flex; flex-direction: column; align-items: center; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-container { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .logo-icon { width: 40px; height: 40px; color: #111; }
        .store-name { font-family: 'Playfair Display', serif; font-size: 32px; color: #111; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
        .report-title { font-size: 16px; font-weight: 600; color: #111; margin: 10px 0 5px 0; text-transform: uppercase; letter-spacing: 2px; }
        .print-meta { color: #555; font-size: 11px; margin: 0; }
        table.data-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; margin-bottom: 20px; }
        table.data-table th, table.data-table td { border-bottom: 1px solid #eee; padding: 16px 10px; text-align: left; }
        table.data-table th { background: #fafafa; font-weight: 600; color: #111; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-top: 1px solid #eee; }
        table.data-table tr.item-row { page-break-inside: avoid; }
        table.data-table tr:nth-child(even) td { background: #fdfdfd; }
      </style>
      
      <div class="header">
        <div class="logo-container">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clip-rule="evenodd" />
          </svg>
          <h1 class="store-name">Nexus Store</h1>
        </div>
        <div class="report-title">Laporan Orders</div>
        <p class="print-meta">Dicetak: ${new Date().toLocaleString('id-ID')} &nbsp;|&nbsp; Total: ${filteredOrders.length} pesanan</p>
      </div>

      <table class="data-table">
        <thead><tr>
          <th>Order Code</th><th>Tanggal</th><th>Items</th><th>Total</th><th>Status</th><th>Metode</th>
        </tr></thead>
        <tbody>${printRows}</tbody>
      </table>`;
      
    generatePdfAndPreview(html, 'Laporan Orders');
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
    { key: 'banners', label: 'Banners', icon: <HiOutlinePhotograph /> },
    { key: 'vouchers', label: 'Voucher', icon: <HiOutlineTicket /> },
    { key: 'users', label: 'Pengguna', icon: <HiOutlineUsers /> },
    { key: 'broadcasts', label: 'Broadcast', icon: <HiOutlineSpeakerphone /> },
    { key: 'laporan', label: 'Laporan Penjualan', icon: <HiOutlineChartBar /> },
  ];

  
  
  // ── Users Handlers ─────────────────────────────
  const toggleUserRole = async (id, currentRole) => {
    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      const res = await fetch(`${API_URL}/users/admin/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) throw new Error('Gagal update role');
      toast.success('Role berhasil diubah');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleUserBan = async (id, isBanned) => {
    try {
      const res = await fetch(`${API_URL}/users/admin/${id}/suspend`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_banned: !isBanned })
      });
      if (!res.ok) throw new Error('Gagal update status');
      toast.success(isBanned ? 'User di-unban' : 'User disuspend');
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Broadcast Handlers ─────────────────────────
  const openAddBroadcast = () => {
    setEditingBroadcast(null);
    setBroadcastForm({ message: '', type: 'info', is_active: true });
    setShowBroadcastModal(true);
  };

  const openEditBroadcast = (b) => {
    setEditingBroadcast(b);
    setBroadcastForm({ message: b.message, type: b.type || 'info', is_active: b.is_active });
    setShowBroadcastModal(true);
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    const body = { ...broadcastForm, createdby: editingBroadcast ? editingBroadcast.createdby : adminUser, lastupdatedby: adminUser };
    try {
      const url = editingBroadcast ? `${API_URL}/broadcasts/${editingBroadcast.id}` : `${API_URL}/broadcasts`;
      const method = editingBroadcast ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Gagal menyimpan broadcast');
      toast.success(editingBroadcast ? 'Broadcast diperbarui' : 'Broadcast ditambahkan');
      setShowBroadcastModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteBroadcast = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Broadcast',
      message: 'Hapus broadcast ini?',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/broadcasts/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus');
          toast.success('Broadcast dihapus');
          fetchData();
        } catch (err) {
          toast.error(err.message);
        }
      }
    });
  };

  // ── Banner Handlers ──────────────────────────────
  const openAddBanner = () => {
    setEditingBanner(null);
    setBannerForm({ title: '', subtitle: '', image_url: '', target_url: '', is_active: true, end_date: '' });
    setShowBannerModal(true);
  };

  const openEditBanner = (b) => {
    setEditingBanner(b);
    setBannerForm({ title: b.title, subtitle: b.subtitle || '', image_url: b.image_url, target_url: b.target_url || '', is_active: b.is_active, end_date: b.end_date ? new Date(b.end_date).toISOString().slice(0, 16) : '' });
    setShowBannerModal(true);
  };

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const webpBlob = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Gagal mengkonversi gambar'));
            }, 'image/webp', 0.85);
          };
          img.onerror = () => reject(new Error('Gagal memuat gambar'));
          img.src = event.target.result;
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsDataURL(file);
      });
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
      const { error } = await supabase.storage.from('Game-Img').upload(fileName, webpBlob, { contentType: 'image/webp' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('Game-Img').getPublicUrl(fileName);
      setBannerForm(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Gambar banner berhasil diunggah!');
    } catch (err) {
      toast.error(err.message || 'Gagal mengunggah gambar');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleBannerSubmit = async (e) => {
    e.preventDefault();
    const body = { ...bannerForm, createdby: editingBanner ? editingBanner.createdby : adminUser, lastupdatedby: adminUser };
    if (!body.end_date) body.end_date = null;
    try {
      const url = editingBanner ? `${API_URL}/banners/${editingBanner.id}` : `${API_URL}/banners`;
      const method = editingBanner ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Gagal menyimpan banner');
      toast.success(editingBanner ? 'Banner diperbarui' : 'Banner ditambahkan');
      setShowBannerModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteBanner = (id, title) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Banner',
      message: `Hapus banner "${title}"?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`${API_URL}/banners/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Gagal menghapus');
          toast.success('Banner dihapus');
          fetchData();
        } catch (err) {
          toast.error(err.message);
        }
      }
    });
  };

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
      <title>Laporan Penjualan</title>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; font-size: 12px; color: #111; margin: 0; background-color: #fff; padding-bottom: 20px; }
        .header { display: flex; flex-direction: column; align-items: center; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 30px; }
        .logo-container { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
        .logo-icon { width: 40px; height: 40px; color: #111; }
        .store-name { font-family: 'Playfair Display', serif; font-size: 32px; color: #111; margin: 0; letter-spacing: 2px; text-transform: uppercase; }
        .report-title { font-size: 16px; font-weight: 600; color: #111; margin: 10px 0 5px 0; text-transform: uppercase; letter-spacing: 2px; }
        .print-meta { color: #555; font-size: 11px; margin: 0; }
        table.data-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; margin-bottom: 30px; }
        table.data-table th, table.data-table td { border-bottom: 1px solid #eee; padding: 16px 10px; text-align: left; }
        table.data-table th { background: #fafafa; font-weight: 600; color: #111; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-top: 1px solid #eee; }
        table.data-table tr.item-row { page-break-inside: avoid; }
        table.data-table tr:nth-child(even) td { background: #fdfdfd; }
        
        .summary { display: flex; gap: 20px; margin-bottom: 30px; }
        .summary-box { background: #fafafa; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px; flex: 1; text-align: center; }
        .summary-box strong { color: #555; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
        .summary-box span { font-size: 20px; font-weight: 600; color: #111; }
        .summary-box .highlight { color: #111; font-size: 24px; }
        h3 { font-family: 'Playfair Display', serif; font-size: 20px; color: #111; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
      </style>
      
      <div class="header">
        <div class="logo-container">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clip-rule="evenodd" />
          </svg>
          <h1 class="store-name">Nexus Store</h1>
        </div>
        <div class="report-title">Laporan Penjualan</div>
        <p class="print-meta">Dicetak: ${new Date().toLocaleString('id-ID')}</p>
      </div>
      
      <div class="summary">
        <div class="summary-box">
          <strong>Total Pendapatan</strong>
          <span class="highlight">${formatPrice(totalRevenue)}</span>
        </div>
        <div class="summary-box">
          <strong>Order Berhasil</strong>
          <span>${successOrders} pesanan</span>
        </div>
        <div class="summary-box">
          <strong>Total Item Terjual</strong>
          <span>${totalItems} unit</span>
        </div>
      </div>

      <h3>Game Terlaris (Top ${topGames.length})</h3>
      <table class="data-table"><thead><tr>
        <th>Rank</th><th>Game</th><th>Qty Terjual</th><th>Total Pendapatan</th>
      </tr></thead><tbody>${printRows}</tbody></table>`;
      
    generatePdfAndPreview(html, 'Laporan Penjualan');
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
      createdby: editingVoucher ? editingVoucher.createdby : adminUser,
      lastupdatedby: adminUser,
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
                        <th>Created By</th>
                        <th>Created Date</th>
                        <th>Updated By</th>
                        <th>Updated Date</th>
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
                          <td className="text-sm">{game.createdby || 'Admin'}</td>
                          <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>{game.createddate ? new Date(game.createddate).toLocaleString('id-ID') : '-'}</td>
                          <td className="text-sm">{game.lastupdatedby || 'Admin'}</td>
                          <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>{game.lastupdateddate ? new Date(game.lastupdateddate).toLocaleString('id-ID') : '-'}</td>
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
          
          
          {/* ─── USERS ─── */}
          {activeTab === 'users' && (
            <div className="animate-fadeIn">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Manajemen Pengguna <span className="admin-badge-count">{usersList.length}</span></h3>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Aksi</th>
                        <th>Pengguna</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.length === 0 ? (
                        <tr><td colSpan="5" className="admin-table-empty">Belum ada pengguna</td></tr>
                      ) : usersList.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="admin-actions">
                              <button className="btn btn-outline btn-sm" onClick={() => toggleUserRole(u.id, u.role)} title="Toggle Role">
                                {u.role === 'admin' ? 'Jadikan User' : 'Jadikan Admin'}
                              </button>
                              <button className={u.is_banned ? "btn btn-success btn-sm" : "btn btn-danger btn-sm"} onClick={() => toggleUserBan(u.id, u.is_banned)} title="Toggle Ban">
                                {u.is_banned ? <><HiOutlineCheckCircle /> Un-Suspend</> : <><HiOutlineBan /> Suspend</>}
                              </button>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{u.full_name || 'Tanpa Nama'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gabung: {new Date(u.createddate || u.created_at || new Date()).toLocaleDateString('id-ID')}</div>
                          </td>
                          <td>{u.email || '-'}</td>
                          <td>
                            <span className={`badge badge-${u.role === 'admin' ? 'primary' : 'outline'}`}>
                              {u.role ? u.role.toUpperCase() : 'USER'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${u.is_banned ? 'danger' : 'success'}`}>
                              {u.is_banned ? 'SUSPENDED' : 'AKTIF'}
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

          {/* ─── BROADCASTS ─── */}
          {activeTab === 'broadcasts' && (
            <div className="animate-fadeIn">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Sistem Broadcast <span className="admin-badge-count">{broadcasts.length}</span></h3>
                  <button className="btn btn-primary btn-sm" onClick={openAddBroadcast}>
                    <HiOutlinePlus /> Tambah Broadcast
                  </button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Aksi</th>
                        <th>Pesan</th>
                        <th>Tipe</th>
                        <th>Status</th>
                        <th>Info Audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {broadcasts.length === 0 ? (
                        <tr><td colSpan="5" className="admin-table-empty">Belum ada broadcast</td></tr>
                      ) : broadcasts.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div className="admin-actions">
                              <button className="btn btn-outline btn-sm" onClick={() => openEditBroadcast(b)} title="Edit"><HiOutlinePencil /></button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBroadcast(b.id)} title="Hapus"><HiOutlineTrash /></button>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.message}</div>
                          </td>
                          <td>
                            <span className={`badge badge-${b.type === 'error' ? 'danger' : b.type === 'warning' ? 'warning' : 'primary'}`}>
                              {b.type.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge-${b.is_active ? 'success' : 'danger'}`}>
                              {b.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="text-sm">
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.lastupdatedby || 'Admin'}</div>
                            <div style={{ whiteSpace: 'nowrap' }}>{b.lastupdateddate ? new Date(b.lastupdateddate).toLocaleDateString('id-ID') : '-'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

{/* ─── BANNERS ─── */}
          {activeTab === 'banners' && (
            <div className="animate-fadeIn">
              <div className="admin-card">
                <div className="admin-card-header">
                  <h3>Daftar Banner <span className="admin-badge-count">{banners.length}</span></h3>
                  <button className="btn btn-primary btn-sm" onClick={openAddBanner}>
                    <HiOutlinePlus /> Tambah Banner
                  </button>
                </div>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Aksi</th>
                        <th>Banner</th>
                        <th>Status</th>
                        <th>Target URL</th>
                        <th>Tanggal Berakhir</th>
                        <th>Info Audit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banners.length === 0 ? (
                        <tr><td colSpan="6" className="admin-table-empty">Belum ada banner</td></tr>
                      ) : banners.map(b => (
                        <tr key={b.id}>
                          <td>
                            <div className="admin-actions">
                              <button className="btn btn-outline btn-sm" onClick={() => openEditBanner(b)} title="Edit"><HiOutlinePencil /></button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteBanner(b.id, b.title)} title="Hapus"><HiOutlineTrash /></button>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img src={b.image_url} alt="" style={{ width: 80, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                              <div>
                                <div style={{ fontWeight: 600 }}>{b.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.subtitle || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${b.is_active ? 'success' : 'danger'}`}>
                              {b.is_active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="text-sm">{b.target_url || '-'}</td>
                          <td className="text-sm">
                            {b.end_date ? new Date(b.end_date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'}).replace('.', ':') : '-'}
                          </td>
                          <td className="text-sm">
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{b.lastupdatedby || 'Admin'}</div>
                            <div style={{ whiteSpace: 'nowrap' }}>{b.lastupdateddate ? new Date(b.lastupdateddate).toLocaleDateString('id-ID') : '-'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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
                        <th>Created By</th>
                        <th>Created Date</th>
                        <th>Updated By</th>
                        <th>Updated Date</th>
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
                            {v.is_active && v.max_uses && v.used_count >= v.max_uses ? (
                              <span className="badge badge-warning" title="Batas penggunaan tercapai">Terpakai</span>
                            ) : (
                              <span className={`badge badge-${v.is_active ? 'success' : 'danger'}`}>
                                {v.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            )}
                          </td>
                          <td className="text-sm">{v.createdby || 'Admin'}</td>
                          <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>{v.createddate ? new Date(v.createddate).toLocaleString('id-ID') : '-'}</td>
                          <td className="text-sm">{v.lastupdatedby || 'Admin'}</td>
                          <td className="text-sm" style={{ whiteSpace: 'nowrap' }}>{v.lastupdateddate ? new Date(v.lastupdateddate).toLocaleString('id-ID') : '-'}</td>
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

      
      {/* ─── BANNER MODAL ─── */}
      {showBannerModal && (
        <div className="modal-overlay" onClick={() => setShowBannerModal(false)}>
          <div className="modal-content animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBanner ? 'Edit Banner' : 'Tambah Banner Baru'}</h2>
              <button className="modal-close" onClick={() => setShowBannerModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal-form" onSubmit={handleBannerSubmit}>
              <div className="form-group">
                <label className="form-label">Judul Banner *</label>
                <input className="form-input" required value={bannerForm.title} onChange={e => setBannerForm({...bannerForm, title: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Subjudul</label>
                <input className="form-input" value={bannerForm.subtitle} onChange={e => setBannerForm({...bannerForm, subtitle: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Target URL</label>
                <input className="form-input" placeholder="/collection" value={bannerForm.target_url} onChange={e => setBannerForm({...bannerForm, target_url: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Status Banner</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" checked={bannerForm.is_active} onChange={() => setBannerForm({...bannerForm, is_active: true})} /> Aktif
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" checked={!bannerForm.is_active} onChange={() => setBannerForm({...bannerForm, is_active: false})} /> Nonaktif
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Berakhir Event (Opsional)</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={bannerForm.end_date} 
                  onChange={e => setBannerForm({...bannerForm, end_date: e.target.value})} 
                />
                <small style={{color: 'rgba(255,255,255,0.4)', display: 'block', marginTop: '4px'}}>
                  Biarkan kosong jika ini bukan promo berbatas waktu.
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Banner Image *</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {bannerForm.image_url ? (
                    <img src={bannerForm.image_url} alt="Preview" style={{ width: 120, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <div style={{ width: 120, height: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>IMG</div>
                  )}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input type="file" accept="image/*" onChange={handleBannerImageUpload} disabled={uploadingImage} className="form-input" style={{ padding: '8px', cursor: uploadingImage ? 'not-allowed' : 'pointer' }} />
                    {uploadingImage && <div style={{ fontSize: '0.8rem', color: '#D4A853' }}>⏳ Mengunggah & mengkonversi...</div>}
                  </div>
                </div>
                {!bannerForm.image_url && <div style={{ fontSize: '0.8rem', color: 'var(--danger-color)', marginTop: 4 }}>* Gambar wajib diupload</div>}
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBannerModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={!bannerForm.image_url || uploadingImage}>
                  {uploadingImage ? 'Mengunggah...' : 'Simpan Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
  
      {/* ─── BROADCAST MODAL ─── */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="modal-content animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBroadcast ? 'Edit Broadcast' : 'Tambah Broadcast'}</h2>
              <button className="modal-close" onClick={() => setShowBroadcastModal(false)}><HiOutlineX /></button>
            </div>
            <form className="modal-form" onSubmit={handleBroadcastSubmit}>
              <div className="form-group">
                <label className="form-label">Pesan Broadcast *</label>
                <textarea className="form-input" required value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})} rows={3}></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Tipe Pesan</label>
                <select className="form-input" value={broadcastForm.type} onChange={e => setBroadcastForm({...broadcastForm, type: e.target.value})}>
                  <option value="info">Info (Biru)</option>
                  <option value="warning">Warning (Kuning)</option>
                  <option value="error">Error/Maintenance (Merah)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status Broadcast</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" checked={broadcastForm.is_active} onChange={() => setBroadcastForm({...broadcastForm, is_active: true})} /> Aktif
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="radio" checked={!broadcastForm.is_active} onChange={() => setBroadcastForm({...broadcastForm, is_active: false})} /> Nonaktif
                  </label>
                </div>
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBroadcastModal(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">Simpan Broadcast</button>
              </div>
            </form>
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
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Cover Image (Katalog & Poster)</label>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" style={{ width: 60, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }} />
                    ) : (
                      <div style={{ width: 60, height: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
                        IMG
                      </div>
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        disabled={uploadingImage}
                        className="form-input"
                        style={{ padding: '8px', cursor: uploadingImage ? 'not-allowed' : 'pointer' }}
                      />
                      {uploadingImage && <div style={{ fontSize: '0.8rem', color: '#D4A853' }}>⏳ Mengunggah & mengkonversi ke .webp...</div>}
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atau URL gambar manual:</div>
                  <input className="form-input" value={formData.image_url} placeholder="https://..."
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} style={{ marginTop: 4 }} />
                </div>

                  
                  <div style={{ marginTop: '24px', gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Logo Game <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Transparan PNG, untuk Carousel & Detail)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      {formData.logo_url ? (
                        <div style={{ background: '#0B0C10', padding: '8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={formData.logo_url} alt="Logo" style={{ maxWidth: '120px', maxHeight: '40px', objectFit: 'contain' }} />
                        </div>
                      ) : (
                        <div style={{ width: 120, height: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                          Logo
                        </div>
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoUpload} 
                          disabled={uploadingImage}
                          className="form-input"
                          style={{ padding: '8px', cursor: uploadingImage ? 'not-allowed' : 'pointer' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atau URL manual:</div>
                    <input className="form-input" value={formData.logo_url || ''} placeholder="https://..."
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })} style={{ marginTop: 4 }} />
                  </div>
                </div>

                  <div style={{ marginTop: '24px', gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Detail Image <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Lanskap lebar untuk Screenshot Utama halaman Detail Game)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {formData.detail_image_url ? (
                        <div style={{ background: '#0B0C10', padding: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                          <img src={formData.detail_image_url} alt="Detail" style={{ maxWidth: '120px', maxHeight: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                        </div>
                      ) : (
                        <div style={{ width: 120, height: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                          IMG
                        </div>
                      )}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleDetailImageUpload} 
                          disabled={uploadingImage}
                          className="form-input"
                          style={{ padding: '8px', cursor: uploadingImage ? 'not-allowed' : 'pointer' }}
                        />
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atau URL manual:</div>
                    <input className="form-input" value={formData.detail_image_url || ''} placeholder="https://..."
                      onChange={(e) => setFormData({ ...formData, detail_image_url: e.target.value })} style={{ marginTop: 4 }} />
                  </div>

                
                {/* === NEW: Carousel Settings === */}
                <div className="form-group" style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '16px' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.is_carousel}
                      onChange={(e) => setFormData({ ...formData, is_carousel: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Tampilkan di Carousel Hero (Beranda)</span>
                  </label>
                  
                  {formData.is_carousel && (
                    <div>
                      <div style={{ marginTop: '12px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          Background Carousel <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Polos, tanpa teks judul)</span>
                        </label>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          {formData.hero_image_url ? (
                            <div style={{ background: '#0B0C10', padding: '4px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <img src={formData.hero_image_url} alt="Hero BG" style={{ maxWidth: '120px', maxHeight: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                            </div>
                          ) : (
                            <div style={{ width: 120, height: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>
                              BG Image
                            </div>
                          )}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input type="file" accept="image/*" onChange={handleHeroImageUpload} disabled={uploadingImage} className="form-input" style={{ padding: '8px', cursor: uploadingImage ? 'not-allowed' : 'pointer' }} />
                          </div>
                        </div>
                        <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Atau URL manual:</div>
                        <input className="form-input" value={formData.hero_image_url || ''} placeholder="https://..." onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })} style={{ marginTop: 4 }} />
                    </div>
                    </div>
                  )}
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

              {editingGame && (
                <div className="admin-audit-info" style={{ marginTop: 24, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: 6 }}><strong>Dibuat oleh:</strong> {editingGame.createdby || 'Admin'} pada {editingGame.createddate ? new Date(editingGame.createddate).toLocaleString('id-ID') : '-'}</div>
                  <div><strong>Terakhir diubah:</strong> {editingGame.lastupdatedby || 'Admin'} pada {editingGame.lastupdateddate ? new Date(editingGame.lastupdateddate).toLocaleString('id-ID') : '-'}</div>
                </div>
              )}

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

              {editingVoucher && (
                <div className="admin-audit-info" style={{ marginTop: 24, padding: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: 6 }}><strong>Dibuat oleh:</strong> {editingVoucher.createdby || 'Admin'} pada {editingVoucher.createddate ? new Date(editingVoucher.createddate).toLocaleString('id-ID') : '-'}</div>
                  <div><strong>Terakhir diubah:</strong> {editingVoucher.lastupdatedby || 'Admin'} pada {editingVoucher.lastupdateddate ? new Date(editingVoucher.lastupdateddate).toLocaleString('id-ID') : '-'}</div>
                </div>
              )}

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
      {/* ─── PDF PREVIEW MODAL ─── */}
      {pdfPreviewUrl && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }}>
          <div className="modal-content animate-scaleIn" style={{ maxWidth: '80vw', width: '100%', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', background: '#111' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#1a1a1a' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem', color: '#fff' }}>
                <HiOutlineDocumentText style={{ color: 'var(--primary)' }} /> Preview {pdfPreviewTitle}
              </h3>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href={pdfPreviewUrl} download={`${pdfPreviewTitle.replace(/\s+/g, '-')}.pdf`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <HiOutlineDownload /> Download PDF
                </a>
                <button className="modal-close" onClick={() => { URL.revokeObjectURL(pdfPreviewUrl); setPdfPreviewUrl(null); }} style={{ position: 'static' }}>
                  <HiOutlineX />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#222', padding: '20px' }}>
              <iframe
                src={pdfPreviewUrl}
                style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

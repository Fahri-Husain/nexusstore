import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { HiOutlineDownload, HiOutlineArrowLeft, HiLightningBolt } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './Invoice.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export default function Invoice() {
  const { orderCode } = useParams();
  const { user, profile } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const invoiceRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/payment/status/${orderCode}`)
      .then(res => {
        if (!res.ok) throw new Error('Gagal mengambil data pesanan');
        return res.json();
      })
      .then(data => {
        setOrder(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [orderCode]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price);

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice_${orderCode}.pdf`);
  };

  const downloadJPG = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = `Invoice_${orderCode}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="invoice-container container" style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Loading...</div>;
  }

  if (error || !order) {
    return <div className="invoice-container container" style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>Error: {error}</div>;
  }

  const subtotal = order.order_items?.reduce((sum, item) => sum + item.price, 0) || 0;
  const discount = subtotal - order.total_amount;

  return (
    <div className="invoice-page">
      <div className="container invoice-wrapper">
        <div className="invoice-actions">
          <Link to="/orders" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HiOutlineArrowLeft /> Kembali
          </Link>
          <div className="invoice-download-btns">
            <button className="btn btn-primary" onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HiOutlineDownload /> PDF
            </button>
            <button className="btn btn-primary" onClick={downloadJPG} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HiOutlineDownload /> JPG
            </button>
          </div>
        </div>

        <div className="invoice-document" ref={invoiceRef}>
          <div className="invoice-header">
            <div className="invoice-logo">
               <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <HiLightningBolt style={{ color: '#000' }} />
                 NEXUS STORE
               </h2>
               <p>Game Library & Store</p>
            </div>
            <div className="invoice-info">
              <h1>INVOICE</h1>
              <p><strong>Order ID:</strong> {order.order_code}</p>
              <p><strong>Tanggal:</strong> {new Date(order.createddate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Pembeli:</strong> {profile?.full_name || user?.email?.split('@')[0] || 'Pelanggan'}</p>
              <p><strong>Metode:</strong> {order.payment_method ? order.payment_method.toUpperCase() : 'Menunggu'}</p>
              <p><strong>Status:</strong> {order.status === 2 ? 'LUNAS' : 'BELUM LUNAS'}</p>
            </div>
          </div>

          <div className="invoice-body">
            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Harga</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items?.map((item, index) => (
                  <tr key={index}>
                    <td>{item.games?.title || `Game ID: ${item.game_id}`}</td>
                    <td>{formatPrice(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="invoice-footer">
            <div className="invoice-total">
              <div className="invoice-row">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="invoice-row" style={{ color: 'red' }}>
                  <span>Diskon:</span>
                  <span>- {formatPrice(discount)}</span>
                </div>
              )}
              <div className="invoice-row invoice-grand-total">
                <span>Total Bayar:</span>
                <span>{formatPrice(order.total_amount)}</span>
              </div>
            </div>
            <p className="invoice-thankyou">Terima kasih telah berbelanja di Nexus Store!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

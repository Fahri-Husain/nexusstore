import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineChat, HiOutlineQuestionMarkCircle, HiChevronDown, HiChevronUp, HiOutlineLightningBolt, HiOutlineShieldCheck, HiOutlineClock } from 'react-icons/hi';
import { staggerContainer, staggerItem, AnimatedButton } from '../lib/motionUtils';
import toast from 'react-hot-toast';
import './Support.css';

const FAQS = [
  {
    q: 'Bagaimana cara membeli game di Nexus Store?',
    a: 'Temukan game yang Anda inginkan di halaman Koleksi, tambahkan ke keranjang, lalu selesaikan pembayaran melalui Midtrans. Game akan langsung muncul di Perpustakaan Anda setelah transaksi berhasil.'
  },
  {
    q: 'Metode pembayaran apa saja yang tersedia?',
    a: 'Kami mendukung berbagai metode pembayaran melalui Midtrans, termasuk transfer bank, kartu kredit/debit, GoPay, OVO, DANA, dan berbagai minimarket seperti Alfamart & Indomaret.'
  },
  {
    q: 'Apakah game bisa dimainkan setelah dibeli?',
    a: 'Ya! Setelah pembelian berhasil, game akan langsung tersedia di Perpustakaan Anda. Anda bisa mengaksesnya kapan saja.'
  },
  {
    q: 'Bagaimana jika transaksi saya gagal?',
    a: 'Jika transaksi gagal, saldo tidak akan terpotong. Coba ulangi pembelian atau gunakan metode pembayaran lain. Jika masalah berlanjut, hubungi tim support kami.'
  },
  {
    q: 'Apakah ada kebijakan pengembalian dana?',
    a: 'Karena sifat produk digital, kami tidak menerima pengembalian dana setelah game berhasil diakses. Namun jika terjadi masalah teknis dari pihak kami, kami akan menyelesaikannya dengan cepat.'
  },
  {
    q: 'Bagaimana cara menghubungi support?',
    a: 'Anda bisa menghubungi kami melalui form di bawah ini atau langsung melalui email di support@nexusstore.id. Tim kami siap membantu 24/7.'
  },
];

export default function Support() {
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Mohon isi semua field yang wajib diisi');
      return;
    }
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    toast.success('Pesan Anda telah terkirim! Kami akan segera menghubungi Anda.');
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="support-page">
      {/* ── Hero ── */}
      <div className="support-hero">
        <div className="support-hero-glow" />
        <div className="container support-hero-content">
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer}
          >
            <motion.p className="support-eyebrow" variants={staggerItem}>PUSAT BANTUAN</motion.p>
            <motion.h1 className="support-title" variants={staggerItem}>
              Ada yang bisa <span className="support-title-accent">kami bantu?</span>
            </motion.h1>
            <motion.p className="support-subtitle" variants={staggerItem}>
              Tim kami siap membantu Anda 24 jam sehari, 7 hari seminggu.
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="container support-content">

        {/* ── Contact Cards ── */}
        <motion.div
          className="support-cards"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          <motion.div className="support-card" variants={staggerItem}>
            <div className="support-card-icon"><HiOutlineMail /></div>
            <h3>Email</h3>
            <p>Kirim email dan kami akan membalas dalam 24 jam</p>
            <a href="mailto:support@nexusstore.id" className="support-card-link">support@nexusstore.id</a>
          </motion.div>
          <motion.div className="support-card support-card-highlight" variants={staggerItem}>
            <div className="support-card-icon"><HiOutlineChat /></div>
            <h3>Live Chat</h3>
            <p>Chat langsung dengan tim support kami sekarang</p>
            <span className="support-badge-live"><span className="support-live-dot" />Online Sekarang</span>
          </motion.div>
          <motion.div className="support-card" variants={staggerItem}>
            <div className="support-card-icon"><HiOutlineClock /></div>
            <h3>Jam Operasional</h3>
            <p>Senin – Minggu, 24 Jam</p>
            <span className="support-card-link">Selalu siap melayani</span>
          </motion.div>
        </motion.div>

        {/* ── Why Choose Us ── */}
        <motion.div
          className="support-features"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          variants={staggerContainer}
        >
          {[
            { icon: <HiOutlineLightningBolt />, label: 'Respons Cepat', desc: 'Rata-rata waktu respons kurang dari 1 jam' },
            { icon: <HiOutlineShieldCheck />, label: 'Solusi Terjamin', desc: 'Kami tidak berhenti sampai masalah Anda selesai' },
            { icon: <HiOutlineQuestionMarkCircle />, label: 'Tim Berpengalaman', desc: 'Didukung oleh tim ahli yang berdedikasi' },
          ].map((f, i) => (
            <motion.div key={i} className="support-feature" variants={staggerItem}>
              <div className="support-feature-icon">{f.icon}</div>
              <div>
                <span className="support-feature-label">{f.label}</span>
                <span className="support-feature-desc">{f.desc}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Main Grid: FAQ + Form ── */}
        <div className="support-main-grid">

          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="support-section-title">Pertanyaan Umum</h2>
            <div className="support-faq-list">
              {FAQS.map((faq, i) => (
                <div
                  key={i}
                  className={`support-faq-item ${openFaq === i ? 'open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="support-faq-q">
                    <span>{faq.q}</span>
                    {openFaq === i ? <HiChevronUp /> : <HiChevronDown />}
                  </div>
                  <AnimatePresence>
                    {openFaq === i && (
                      <motion.div
                        className="support-faq-a"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <p>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="support-section-title">Hubungi Kami</h2>
            <form className="support-form" onSubmit={handleSubmit}>
              <div className="support-form-row">
                <div className="support-field">
                  <label>Nama Lengkap <span>*</span></label>
                  <input
                    type="text"
                    placeholder="Nama Anda"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="support-field">
                  <label>Email <span>*</span></label>
                  <input
                    type="email"
                    placeholder="email@anda.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="support-field">
                <label>Subjek</label>
                <input
                  type="text"
                  placeholder="Topik pertanyaan Anda"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                />
              </div>
              <div className="support-field">
                <label>Pesan <span>*</span></label>
                <textarea
                  placeholder="Ceritakan masalah atau pertanyaan Anda secara detail..."
                  rows={6}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>
              <AnimatedButton type="submit" className="support-submit-btn" disabled={sending}>
                {sending ? 'Mengirim...' : 'Kirim Pesan'}
              </AnimatedButton>
            </form>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

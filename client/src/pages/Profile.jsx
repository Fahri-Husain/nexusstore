import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { HiOutlineUser, HiOutlineMail, HiOutlinePencil, HiCheck, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineCalendar } from 'react-icons/hi';
import { staggerContainer, staggerItem } from '../lib/motionUtils';
import toast from 'react-hot-toast';
import './Profile.css';

export default function Profile() {
  const { user, profile, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [loading, setLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({ full_name: fullName, phone, address });
      toast.success('Profil berhasil diperbarui!');
      setEditing(false);
    } catch (error) {
      toast.error('Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  const getAvatarUrl = () =>
    profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const joinDate = profile?.createddate
    ? new Date(profile.createddate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    : '-';

  return (
    <div className="profile-page">
      <div className="container">
        <motion.h1
          className="profile-page-title"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Profil Saya
        </motion.h1>

        <motion.div
          className="profile-layout"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {/* ── Left: Avatar Card ── */}
          <motion.div className="profile-left-card" variants={staggerItem}>
            <div className="profile-avatar-wrap">
              <div className="profile-avatar-lg">
                {getAvatarUrl() && !avatarError ? (
                  <img
                    src={getAvatarUrl()}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <HiOutlineUser />
                )}
              </div>
            </div>

            <p className="profile-name">{profile?.full_name || 'Pengguna'}</p>
            <p className="profile-email">{user?.email}</p>

            <span className="profile-role-badge">
              {profile?.role === 'admin' ? '👑 Admin' : '🎮 Customer'}
            </span>

            <div className="profile-divider" />

            <div className="profile-stat-row">
              <div className="profile-stat">
                <span className="profile-stat-num">–</span>
                <span className="profile-stat-label">Pesanan</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-num">–</span>
                <span className="profile-stat-label">Game</span>
              </div>
              <div className="profile-stat">
                <span className="profile-stat-num">{joinDate.split(' ')[1] || '–'}</span>
                <span className="profile-stat-label">Bergabung</span>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Detail Card ── */}
          <motion.div className="profile-right-card" variants={staggerItem}>
            <div className="profile-card-header">
              <span className="profile-card-title">Informasi Akun</span>
              {!editing && (
                <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                  <HiOutlinePencil /> Edit Profil
                </button>
              )}
            </div>

            <div className="profile-fields">
              <div className="profile-field-row">
                <div className="profile-field">
                  <label><HiOutlineMail /> Email</label>
                  <span>{user?.email}</span>
                </div>
                <div className="profile-field">
                  <label><HiOutlineCalendar /> Bergabung Sejak</label>
                  <span>{joinDate}</span>
                </div>
              </div>

              <div className="profile-field-row">
                <div className="profile-field">
                  <label><HiOutlineUser /> Nama Lengkap</label>
                  {editing ? (
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Nama Anda"
                    />
                  ) : (
                    <span>{profile?.full_name || '–'}</span>
                  )}
                </div>
                <div className="profile-field">
                  <label><HiOutlinePhone /> Nomor Telepon</label>
                  {editing ? (
                    <input
                      type="text"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                    />
                  ) : (
                    <span>{profile?.phone || '–'}</span>
                  )}
                </div>
              </div>

              <div className="profile-field">
                <label><HiOutlineLocationMarker /> Alamat</label>
                {editing ? (
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Alamat lengkap Anda"
                    rows={3}
                  />
                ) : (
                  <span>{profile?.address || '–'}</span>
                )}
              </div>

              {editing && (
                <div className="profile-actions">
                  <button className="profile-save-btn" onClick={handleSave} disabled={loading}>
                    <HiCheck /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                  <button className="profile-cancel-btn" onClick={() => setEditing(false)}>
                    Batal
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

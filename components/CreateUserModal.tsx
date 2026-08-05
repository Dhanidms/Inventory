'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { X, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import type { Role } from '@/types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'pic' as Role,
  });
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let finalEmail = formData.email.trim();
    if (!finalEmail) {
      finalEmail = `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}${Math.floor(Math.random() * 1000)}@inventory.local`;
    }

    let finalPassword = formData.password;
    if (!finalPassword) {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
      for (let i = 0; i < 8; i++) finalPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, email: finalEmail, password: finalPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat pengguna');
      }

      toast.success('Pengguna berhasil dibuat!');
      onSuccess();
      setCreatedCredentials({ email: finalEmail, password: finalPassword });
      setFormData({ name: '', email: '', password: '', role: 'pic' });
    } catch (error: any) {
      console.error('Error creating user:', error);
      const msg = error.message;
      toast.error(msg === '{}' ? 'Terjadi error tidak dikenal dari Supabase (Cek console)' : (msg || 'Terjadi kesalahan sistem'));
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: pass });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)'
    }}>
      <div className="card card-lg" style={{
        width: '100%',
        maxWidth: '450px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
      }}>
        <button
          onClick={() => {
            setCreatedCredentials(null);
            onClose();
          }}
          className="btn btn-ghost btn-icon"
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
        >
          <X size={20} />
        </button>

        {createdCredentials ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: 'var(--success)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <UserPlus size={24} />
            </div>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem', fontWeight: 700, fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pengguna Dibuat!</h2>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Berikan informasi login ini kepada pengguna. Password hanya ditampilkan sekali ini saja.
            </p>
            <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius)', textAlign: 'left', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '0.5rem' }}>
                <span className="label" style={{ display: 'block', marginBottom: '0.25rem' }}>Email:</span>
                <code style={{ color: 'var(--accent)', fontSize: '0.875rem', fontFamily: "'IBM Plex Mono', monospace" }}>{createdCredentials.email}</code>
              </div>
              <div>
                <span className="label" style={{ display: 'block', marginBottom: '0.25rem' }}>Password:</span>
                <code style={{ color: 'var(--accent)', fontSize: '0.875rem', fontFamily: "'IBM Plex Mono', monospace" }}>{createdCredentials.password}</code>
              </div>
            </div>
            <button
              onClick={() => {
                setCreatedCredentials(null);
                onClose();
              }}
              className="btn btn-primary btn-full"
            >
              Selesai
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="stat-icon" style={{ background: 'var(--accent-light)' }}>
                <UserPlus size={20} color="var(--accent)" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>Tambah Pengguna</h2>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Buat akun baru untuk staf Anda.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div className="form-group">
                <label className="label">Email (Opsional)</label>
                <input
                  type="email"
                  className="input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Akan dibuat otomatis jika kosong"
                />
              </div>

              <div className="form-group">
                <label className="label">Password (Opsional)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Akan digenerate otomatis jika kosong"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="btn btn-secondary btn-sm"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Role</label>
                <select
                  className="select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                >
                  <option value="pic">PIC (Standar)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  Buat Pengguna
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

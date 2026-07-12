'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { X, Loader2, UserPlus } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal membuat pengguna');
      }

      toast.success('Pengguna berhasil dibuat!');
      onSuccess();
      onClose();
      setFormData({ name: '', email: '', password: '', role: 'pic' });
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan sistem');
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
      backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '0.75rem',
        padding: '1.5rem',
        width: '100%',
        maxWidth: '450px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        color: '#f8fafc',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1rem', right: '1rem',
            background: 'none', border: 'none', color: '#94a3b8',
            cursor: 'pointer', padding: '0.25rem'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '0.5rem',
            background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <UserPlus size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Tambah Pengguna</h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#94a3b8' }}>Buat akun baru untuk staf Anda.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#cbd5e1' }}>Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none'
              }}
              placeholder="Contoh: Budi Santoso"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#cbd5e1' }}>Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none'
              }}
              placeholder="budi@example.com"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#cbd5e1' }}>Password</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  flex: 1, padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                  border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none'
                }}
                placeholder="Password yang kuat"
              />
              <button
                type="button"
                onClick={generatePassword}
                style={{
                  padding: '0 0.75rem', borderRadius: '0.375rem',
                  backgroundColor: '#334155', color: '#f8fafc',
                  border: 'none', cursor: 'pointer', fontSize: '0.875rem'
                }}
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem', color: '#cbd5e1' }}>Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
              style={{
                width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.375rem',
                border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', outline: 'none'
              }}
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
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                backgroundColor: 'transparent', border: '1px solid #334155',
                color: '#cbd5e1', cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.375rem',
                backgroundColor: '#4f46e5', border: 'none',
                color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              Buat Pengguna
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

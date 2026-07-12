'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Role } from '@/types';
import { toast } from 'sonner';
import { Shield, UserCheck, Power, PowerOff, Loader2, UserPlus } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import CreateUserModal from '@/components/CreateUserModal';

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const updateRole = async (userId: string, role: Role) => {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) { toast.error('Gagal update role'); return; }
    toast.success(`Role diubah ke ${role}`);
    await loadUsers();
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    const { error } = await supabase.from('users').update({ is_active: !currentActive }).eq('id', userId);
    if (error) { toast.error('Gagal update status'); return; }
    toast.success(currentActive ? 'Akun dinonaktifkan' : 'Akun diaktifkan');
    await loadUsers();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <Loader2 size={32} style={{ animation: 'spin 0.6s linear infinite' }} />
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Manajemen Pengguna</h1>
          <p className="page-subtitle">{users.length} pengguna terdaftar</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#4f46e5', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
        >
          <UserPlus size={18} />
          Tambah Pengguna
        </button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Provider</th>
              <th>Role</th>
              <th>Status</th>
              <th>Bergabung</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ opacity: user.is_active ? 1 : 0.5 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, color: 'white', fontSize: '0.875rem', overflow: 'hidden',
                    }}>
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (user.name || user.email || '?')[0].toUpperCase()
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.name || '-'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`badge ${user.auth_provider === 'google' ? 'badge-info' : 'badge-muted'}`}>
                    {user.auth_provider === 'google' ? '🔵 Google' : '📧 Email'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.role === 'admin' ? 'badge-accent' : 'badge-success'}`}>
                    {user.role === 'admin' ? '⚡ Admin' : '👤 PIC'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{formatDate(user.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => updateRole(user.id, user.role === 'admin' ? 'pic' : 'admin')}
                      className="btn btn-ghost btn-sm"
                      title={user.role === 'admin' ? 'Turunkan ke PIC' : 'Naikkan ke Admin'}
                      style={{ gap: '0.375rem' }}
                    >
                      {user.role === 'admin' ? <UserCheck size={13} /> : <Shield size={13} />}
                      {user.role === 'admin' ? '→ PIC' : '→ Admin'}
                    </button>
                    <button
                      onClick={() => toggleActive(user.id, user.is_active)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: user.is_active ? '#ef4444' : '#10b981' }}
                      title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {user.is_active ? <PowerOff size={13} /> : <Power size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="alert alert-info" style={{ marginTop: '1rem' }}>
        <Shield size={18} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem' }}>
          <strong>Catatan:</strong> User baru yang login via Google otomatis mendapat role <strong>PIC</strong>.
          Ubah ke Admin jika diperlukan akses penuh. Nonaktifkan akun untuk mencabut semua akses tanpa menghapus data.
        </div>
      </div>

      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadUsers}
      />
    </div>
  );
}

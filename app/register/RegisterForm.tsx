'use client';

import { useState, FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!name) newErrors.name = 'Nama lengkap wajib diisi';
    if (!email) newErrors.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format email tidak valid';
    
    if (!password) newErrors.password = 'Password wajib diisi';
    else if (password.length < 6) newErrors.password = 'Password minimal 6 karakter';
    
    if (password !== confirmPassword) newErrors.confirmPassword = 'Password tidak cocok';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    // 1. Sign up user di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          name: name,
        }
      }
    });

    if (authError) {
      toast.error('Gagal mendaftar: ' + authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Coba masukkan ke tabel users (role = pic default)
      // Jika di Supabase sudah ada trigger, ini mungkin error tapi tidak masalah karena auth sukses.
      const { error: insertError } = await supabase.from('users').insert({
        id: authData.user.id,
        name: name,
        role: 'pic',
      });

      if (insertError && !insertError.message.includes('duplicate key')) {
        console.warn('Note: Gagal insert ke tabel users (mungkin sudah ditangani oleh trigger):', insertError.message);
      }

      toast.success('Pendaftaran berhasil! Silakan cek email Anda jika verifikasi aktif, atau langsung login.');
      router.push('/login');
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error) {
      toast.error('Gagal daftar dengan Google: ' + error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="card card-lg" style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5)' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--text-primary)', fontFamily: "'Oswald', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Daftar Akun Baru
      </h2>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="btn btn-secondary btn-full"
        style={{ marginBottom: '1rem', gap: '0.75rem', padding: '0.75rem' }}
        id="btn-google-register"
      >
        {googleLoading ? (
          <Loader2 size={18} style={{ animation: 'spin 0.6s linear infinite' }} />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        {googleLoading ? 'Menghubungkan...' : 'Daftar dengan Google'}
      </button>

      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        margin: '1rem 0', color: 'var(--text-muted)', fontSize: '0.8rem',
      }}>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
        <span>atau daftar dengan email</span>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
      </div>

      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Name */}
        <div className="form-group">
          <label className="label" htmlFor="name">Nama Lengkap</label>
          <div style={{ position: 'relative' }}>
            <User
              size={16}
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
            />
            <input
              id="name"
              type="text"
              className={`input ${errors.name ? 'input-error' : ''}`}
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Masukkan nama lengkap"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })); }}
            />
          </div>
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="label" htmlFor="email">Email</label>
          <div style={{ position: 'relative' }}>
            <Mail
              size={16}
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
            />
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              style={{ paddingLeft: '2.5rem' }}
              placeholder="nama@email.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
            />
          </div>
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="form-group">
          <label className="label" htmlFor="password">Password</label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={16}
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`input ${errors.password ? 'input-error' : ''}`}
              style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0,
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label className="label" htmlFor="confirmPassword">Konfirmasi Password</label>
          <div style={{ position: 'relative' }}>
            <Lock
              size={16}
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
            />
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
              style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              placeholder="Ulangi password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirmPassword: undefined })); }}
            />
          </div>
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: '0.5rem' }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 0.6s linear infinite' }} />
              Mendaftar...
            </>
          ) : (
            'Daftar Sekarang'
          )}
        </button>
        
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Masuk di sini
          </Link>
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Format email tidak valid';
    if (!password) newErrors.password = 'Password wajib diisi';
    else if (password.length < 6) newErrors.password = 'Password minimal 6 karakter';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(
        error.message.includes('Invalid login')
          ? 'Email atau password salah'
          : error.message
      );
    } else {
      toast.success('Login berhasil!');
      router.push('/dashboard');
      router.refresh();
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });

    if (error) {
      toast.error('Gagal login dengan Google: ' + error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="card card-lg" style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.5rem', color: '#f1f5f9' }}>
        Masuk ke Akun
      </h2>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="btn btn-secondary btn-full"
        style={{ marginBottom: '1rem', gap: '0.75rem', padding: '0.75rem' }}
        id="btn-google-login"
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
        {googleLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
      </button>

      {/* Divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        margin: '1rem 0', color: '#64748b', fontSize: '0.8rem',
      }}>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
        <span>atau masuk dengan email</span>
        <div className="divider" style={{ flex: 1, margin: 0 }} />
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
              autoComplete="email"
              inputMode="email"
            />
          </div>
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

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
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
              autoComplete="current-password"
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

        <button
          type="submit"
          id="btn-email-login"
          disabled={loading || googleLoading}
          className="btn btn-primary btn-full btn-lg"
          style={{ marginTop: '0.5rem' }}
        >
          {loading ? (
            <>
              <Loader2 size={18} style={{ animation: 'spin 0.6s linear infinite' }} />
              Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </button>
      </form>
    </div>
  );
}

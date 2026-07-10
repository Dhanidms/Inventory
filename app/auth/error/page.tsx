import Link from 'next/link';

export default function AuthErrorPage() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', padding: '1rem',
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Autentikasi Gagal
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
          Terjadi kesalahan saat proses login. Silakan coba lagi.
        </p>
        <Link href="/login" className="btn btn-primary btn-full">
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}

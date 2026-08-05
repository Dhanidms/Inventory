export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '60vh',
      width: '100%',
      gap: '1.5rem',
      color: 'var(--text-secondary)'
    }}>
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <div style={{
        fontSize: '0.875rem',
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>
        Memuat Data...
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

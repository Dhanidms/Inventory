import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Package, PackageCheck, PackageX, Wrench, FileText, AlertTriangle } from 'lucide-react';
import { isOverdue, getDaysOverdue, formatDate, getWhatsAppLink } from '@/lib/date-utils';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase.from('users').select('role, name').eq('id', user!.id).single();

  const isAdmin = userData?.role === 'admin';

  // ─── Stats ─────────────────────────────────────────────────────────────────
  const { data: items } = await supabase.from('items').select('status');
  const totalItems = items?.length ?? 0;
  const available = items?.filter(i => i.status === 'tersedia').length ?? 0;
  const rented = items?.filter(i => i.status === 'disewa').length ?? 0;
  const maintenance = items?.filter(i => i.status === 'maintenance').length ?? 0;

  // ─── Active Surat Jalan ─────────────────────────────────────────────────────
  let sjQuery = supabase
    .from('surat_jalan')
    .select(`
      id, nomor_sj, pic_name, pic_phone, event_name,
      tanggal_ambil, tanggal_rencana_kembali, status,
      surat_jalan_items(id, status_masuk)
    `)
    .not('status', 'in', '("selesai")')
    .order('tanggal_rencana_kembali', { ascending: true });

  if (!isAdmin) {
    sjQuery = sjQuery.eq('pic_user_id', user!.id);
  }

  const { data: activeSJ } = await sjQuery.limit(20);

  // ─── Recent Scan Logs ───────────────────────────────────────────────────────
  const { data: recentLogs } = isAdmin ? await supabase
    .from('scan_logs')
    .select(`
      id, action, scanned_at, notes,
      item:items(name, qr_code),
      surat_jalan:surat_jalan(nomor_sj),
      scanner:users(name)
    `)
    .order('scanned_at', { ascending: false })
    .limit(10) : { data: [] };

  const stats = [
    { label: 'Total Barang', value: totalItems, icon: Package, color: 'accent', bg: 'rgba(99,102,241,0.15)', iconColor: '#818cf8' },
    { label: 'Tersedia', value: available, icon: PackageCheck, color: 'success', bg: 'rgba(16,185,129,0.15)', iconColor: '#10b981' },
    { label: 'Disewa', value: rented, icon: PackageX, color: 'warning', bg: 'rgba(245,158,11,0.15)', iconColor: '#f59e0b' },
    { label: 'Maintenance', value: maintenance, icon: Wrench, color: 'danger', bg: 'rgba(239,68,68,0.15)', iconColor: '#ef4444' },
  ];

  return (
    <div>
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Selamat datang, {userData?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="page-subtitle">
            {isAdmin ? 'Admin — akses penuh ke semua fitur' : 'PIC — lihat surat jalan Anda'}
          </p>
        </div>
        {isAdmin && (
          <Link href="/surat-jalan/baru" className="btn btn-primary">
            <FileText size={16} />
            Buat Surat Jalan
          </Link>
        )}
      </div>

      {/* ─── Stats Grid ─────────────────────────────────────────────────────── */}
      {isAdmin && (
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {stats.map(stat => (
            <div key={stat.label} className={`stat-card ${stat.color}`}>
              <div className="stat-icon" style={{ background: stat.bg }}>
                <stat.icon size={20} color={stat.iconColor} />
              </div>
              <div className="stat-value" style={{ color: stat.iconColor }}>
                {stat.value}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 340px' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        {/* ─── Active Surat Jalan ────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Surat Jalan Aktif
            </h2>
            <Link href="/surat-jalan" className="btn btn-ghost btn-sm">Lihat semua</Link>
          </div>

          {!activeSJ || activeSJ.length === 0 ? (
            <div className="empty-state">
              <FileText size={40} />
              <p>Tidak ada surat jalan aktif</p>
            </div>
          ) : (
            <div>
              {activeSJ.map(sj => {
                const overdue = isOverdue(sj.tanggal_rencana_kembali, sj.status);
                const daysOver = overdue ? getDaysOverdue(sj.tanggal_rencana_kembali) : 0;
                const totalItems = sj.surat_jalan_items?.length ?? 0;
                const returnedItems = sj.surat_jalan_items?.filter((i: { status_masuk: boolean }) => i.status_masuk).length ?? 0;

                return (
                  <Link
                    key={sj.id}
                    href={`/surat-jalan/${sj.id}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    <div
                      className={overdue ? 'overdue-row' : ''}
                      style={{
                        padding: '0.875rem 1.25rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', gap: '0.5rem',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => !overdue && ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => !overdue && ((e.currentTarget as HTMLElement).style.background = '')}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f1f5f9' }}>
                            {sj.event_name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                            {sj.nomor_sj}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                          {overdue ? (
                            <span className="badge badge-danger">
                              <AlertTriangle size={10} />
                              {daysOver}h overdue
                            </span>
                          ) : (
                            <span className={`badge ${sj.status === 'keluar' ? 'badge-warning' : sj.status === 'sebagian_kembali' ? 'badge-info' : 'badge-muted'}`}>
                              {sj.status === 'draft' ? 'Draft' :
                               sj.status === 'keluar' ? 'Keluar' :
                               sj.status === 'sebagian_kembali' ? 'Sebagian' : sj.status}
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <a
                            href={getWhatsAppLink(sj.pic_phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{
                              fontSize: '0.78rem',
                              color: '#10b981',
                              textDecoration: 'none',
                              display: 'flex', alignItems: 'center', gap: '0.25rem',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                              <path d="M11.99 0C5.373 0 0 5.373 0 11.99c0 2.114.553 4.1 1.518 5.83L0 24l6.335-1.66A11.945 11.945 0 0011.99 24C18.607 24 24 18.627 24 12.01 24 5.373 18.607 0 11.99 0zm0 21.818a9.818 9.818 0 01-5.003-1.37l-.36-.213-3.76.986 1.003-3.66-.234-.376A9.818 9.818 0 012.17 12.01c0-5.412 4.408-9.82 9.82-9.82 5.413 0 9.82 4.408 9.82 9.82s-4.407 9.808-9.82 9.808z"/>
                            </svg>
                            {sj.pic_name}
                          </a>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Kembali: {formatDate(sj.tanggal_rencana_kembali)}
                          </span>
                          {totalItems > 0 && (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                              {returnedItems}/{totalItems} kembali
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      {totalItems > 0 && sj.status !== 'draft' && (
                        <div className="progress-bar" style={{ height: '4px' }}>
                          <div
                            className="progress-fill"
                            style={{ width: `${(returnedItems / totalItems) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Recent Scan Logs (Admin only) ────────────────────────────────── */}
        {isAdmin && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border)',
            }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Aktivitas Scan</h2>
            </div>

            {!recentLogs || recentLogs.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <p style={{ fontSize: '0.875rem' }}>Belum ada aktivitas scan</p>
              </div>
            ) : (
              <div>
                {(recentLogs as Array<{
                  id: string;
                  action: string;
                  scanned_at: string;
                  item: { name: string; qr_code: string } | null;
                  surat_jalan: { nomor_sj: string } | null;
                  scanner: { name: string } | null;
                }>).map(log => (
                  <div
                    key={log.id}
                    style={{
                      padding: '0.75rem 1.25rem',
                      borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                    }}
                  >
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: log.action === 'keluar' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                      fontSize: '0.7rem',
                    }}>
                      {log.action === 'keluar' ? '↗' : '↙'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.item?.name ?? '-'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                        {log.surat_jalan?.nomor_sj} • {log.scanner?.name}
                      </div>
                    </div>
                    <span className={`badge ${log.action === 'keluar' ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                      {log.action}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

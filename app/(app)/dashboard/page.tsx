import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Package, PackageCheck, PackageX, Wrench, FileText, AlertTriangle } from 'lucide-react';
import { isOverdue, getDaysOverdue, formatDate, getWhatsAppLink } from '@/lib/date-utils';
import Link from 'next/link';
import WhatsAppLink from '@/components/WhatsAppLink';
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
    { label: 'Total Barang', value: totalItems, icon: Package, color: 'accent', bg: 'rgba(242,166,56,0.12)', iconColor: '#f2a638' },
    { label: 'Tersedia', value: available, icon: PackageCheck, color: 'success', bg: 'rgba(73,183,171,0.12)', iconColor: '#49b7ab' },
    { label: 'Disewa', value: rented, icon: PackageX, color: 'warning', bg: 'rgba(242,166,56,0.12)', iconColor: '#f2a638' },
    { label: 'Maintenance', value: maintenance, icon: Wrench, color: 'danger', bg: 'rgba(224,85,58,0.12)', iconColor: '#e0553a' },
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
                      className={overdue ? 'overdue-row' : 'sj-row'}
                      style={{
                        padding: '0.875rem 1.25rem',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex', flexDirection: 'column', gap: '0.5rem',
                        transition: 'background 0.15s',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#ece8e0' }}>
                            {sj.event_name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#6b7170', marginTop: '0.15rem', fontFamily: "'IBM Plex Mono', monospace" }}>
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
                          <WhatsAppLink 
                            href={getWhatsAppLink(sj.pic_phone)} 
                            name={sj.pic_name} 
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#6b7170' }}>
                             Kembali: {formatDate(sj.tanggal_rencana_kembali)}
                           </span>
                           {totalItems > 0 && (
                             <span style={{ fontSize: '0.72rem', color: '#9aa19f' }}>
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
                      width: '28px', height: '28px', borderRadius: '3px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: log.action === 'keluar' ? 'rgba(242,166,56,0.15)' : 'rgba(73,183,171,0.15)',
                      fontSize: '0.7rem',
                    }}>
                      {log.action === 'keluar' ? '↗' : '↙'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ece8e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.item?.name ?? '-'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6b7170', marginTop: '0.1rem', fontFamily: "'IBM Plex Mono', monospace" }}>
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

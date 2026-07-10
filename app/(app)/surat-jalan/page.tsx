import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, AlertTriangle } from 'lucide-react';
import { isOverdue, getDaysOverdue, formatDate } from '@/lib/date-utils';

export const metadata: Metadata = { title: 'Surat Jalan' };

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', keluar: 'Barang Keluar',
  sebagian_kembali: 'Sebagian Kembali', selesai: 'Selesai', overdue: 'Overdue',
};
const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-muted', keluar: 'badge-warning',
  sebagian_kembali: 'badge-info', selesai: 'badge-success', overdue: 'badge-danger',
};

export default async function SuratJalanPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user!.id).single();
  const isAdmin = userData?.role === 'admin';

  let query = supabase
    .from('surat_jalan')
    .select(`
      id, nomor_sj, pic_name, pic_phone, event_name,
      tanggal_ambil, tanggal_rencana_kembali, status, created_at,
      surat_jalan_items(id, status_masuk)
    `)
    .order('created_at', { ascending: false });

  if (!isAdmin) query = query.eq('pic_user_id', user!.id);
  if (params.status) query = query.eq('status', params.status);
  if (params.q) query = query.ilike('event_name', `%${params.q}%`);

  const { data: sjList } = await query.limit(100);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Surat Jalan</h1>
          <p className="page-subtitle">{sjList?.length ?? 0} surat jalan</p>
        </div>
        {isAdmin && (
          <Link href="/surat-jalan/baru" className="btn btn-primary">
            <Plus size={16} />
            Buat Surat Jalan
          </Link>
        )}
      </div>

      {/* Filter */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.875rem' }}>
        <form style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Cari nama event..."
            className="input"
            style={{ flex: 1, minWidth: '160px' }}
          />
          <select name="status" defaultValue={params.status} className="select" style={{ minWidth: '160px' }}>
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="keluar">Barang Keluar</option>
            <option value="sebagian_kembali">Sebagian Kembali</option>
            <option value="selesai">Selesai</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm">Filter</button>
          <Link href="/surat-jalan" className="btn btn-ghost btn-sm">Reset</Link>
        </form>
      </div>

      {!sjList || sjList.length === 0 ? (
        <div className="card empty-state">
          <p>Tidak ada surat jalan</p>
          {isAdmin && <Link href="/surat-jalan/baru" className="btn btn-primary btn-sm">Buat Surat Jalan</Link>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {(sjList as Array<{
            id: string;
            nomor_sj: string;
            pic_name: string;
            pic_phone: string;
            event_name: string;
            tanggal_ambil: string;
            tanggal_rencana_kembali: string;
            status: string;
            created_at: string;
            surat_jalan_items: Array<{ id: string; status_masuk: boolean }>;
          }>).map(sj => {
            const overdue = isOverdue(sj.tanggal_rencana_kembali, sj.status);
            const daysOver = overdue ? getDaysOverdue(sj.tanggal_rencana_kembali) : 0;
            const total = sj.surat_jalan_items?.length ?? 0;
            const returned = sj.surat_jalan_items?.filter(i => i.status_masuk).length ?? 0;

            return (
              <Link
                key={sj.id}
                href={`/surat-jalan/${sj.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  className={`card card-sm ${overdue ? 'overdue-row' : ''}`}
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s',
                    borderLeft: overdue ? '3px solid var(--danger)' : '3px solid transparent',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>{sj.event_name}</span>
                      <span className={`badge ${overdue ? 'badge-danger' : STATUS_BADGE[sj.status] ?? 'badge-muted'}`}>
                        {overdue && <AlertTriangle size={10} />}
                        {overdue ? `${daysOver}h overdue` : STATUS_LABEL[sj.status] ?? sj.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                      {sj.nomor_sj} • PIC: <strong>{sj.pic_name}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem', color: '#64748b', flexWrap: 'wrap' }}>
                      <span>Ambil: {formatDate(sj.tanggal_ambil)}</span>
                      <span>Kembali: {formatDate(sj.tanggal_rencana_kembali)}</span>
                      {total > 0 && <span>{returned}/{total} barang kembali</span>}
                    </div>
                    {total > 0 && sj.status !== 'draft' && (
                      <div className="progress-bar" style={{ marginTop: '0.5rem', height: '4px' }}>
                        <div className="progress-fill" style={{ width: `${(returned / total) * 100}%` }} />
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

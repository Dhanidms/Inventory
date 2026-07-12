import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { QrCode, PackageOpen, PackageCheck } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';

export const metadata: Metadata = { title: 'Scan Console' };

export default async function ScanPage() {
  const supabase = await createClient();

  const { data: draftSJ } = await supabase
    .from('surat_jalan')
    .select('id, nomor_sj, event_name, pic_name, tanggal_ambil, surat_jalan_items(id)')
    .eq('status', 'draft')
    .order('tanggal_ambil', { ascending: true });

  const { data: activeSJ } = await supabase
    .from('surat_jalan')
    .select('id, nomor_sj, event_name, pic_name, tanggal_rencana_kembali, surat_jalan_items(id, status_masuk)')
    .in('status', ['keluar', 'sebagian_kembali'])
    .order('tanggal_rencana_kembali', { ascending: true });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Scan Console</h1>
          <p className="page-subtitle">Pilih surat jalan untuk proses barang keluar atau masuk</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Check-out */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '3px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageOpen size={18} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Barang Keluar</h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Surat jalan status Draft</p>
            </div>
          </div>

          {!draftSJ || draftSJ.length === 0 ? (
            <div className="card empty-state" style={{ padding: '2rem' }}>
              <QrCode size={32} />
              <p style={{ fontSize: '0.875rem' }}>Tidak ada surat jalan Draft</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(draftSJ as Array<{
                id: string;
                nomor_sj: string;
                event_name: string;
                pic_name: string;
                tanggal_ambil: string;
                surat_jalan_items: Array<{ id: string }>;
              }>).map(sj => (
                <Link
                  key={sj.id}
                  href={`/scan/keluar/${sj.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="card card-sm" style={{
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.875rem',
                    borderLeft: '3px solid var(--accent)',
                    transition: 'box-shadow 0.15s',
                  }}>
                    <PackageOpen size={20} color="var(--accent)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sj.event_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace" }}>
                        {sj.nomor_sj} • {sj.surat_jalan_items.length} barang • {formatDate(sj.tanggal_ambil)}
                      </div>
                    </div>
                    <span className="badge badge-warning" style={{ flexShrink: 0 }}>KELUAR →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Check-in */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '3px', background: 'rgba(73,183,171,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PackageCheck size={18} color="var(--success)" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Barang Masuk</h2>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>Surat jalan aktif (sudah keluar)</p>
            </div>
          </div>

          {!activeSJ || activeSJ.length === 0 ? (
            <div className="card empty-state" style={{ padding: '2rem' }}>
              <QrCode size={32} />
              <p style={{ fontSize: '0.875rem' }}>Tidak ada surat jalan aktif</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(activeSJ as Array<{
                id: string;
                nomor_sj: string;
                event_name: string;
                pic_name: string;
                tanggal_rencana_kembali: string;
                surat_jalan_items: Array<{ id: string; status_masuk: boolean }>;
              }>).map(sj => {
                const total = sj.surat_jalan_items.length;
                const returned = sj.surat_jalan_items.filter(i => i.status_masuk).length;
                return (
                  <Link
                    key={sj.id}
                    href={`/scan/masuk/${sj.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="card card-sm" style={{
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem',
                      borderLeft: '3px solid var(--success)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <PackageCheck size={20} color="var(--success)" style={{ flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {sj.event_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace" }}>
                            {sj.nomor_sj} • Kembali: {formatDate(sj.tanggal_rencana_kembali)}
                          </div>
                        </div>
                        <span className="badge badge-success" style={{ flexShrink: 0 }}>← MASUK</span>
                      </div>
                      <div className="progress-bar" style={{ height: '4px' }}>
                        <div className="progress-fill" style={{ width: `${total ? (returned / total) * 100 : 0}%` }} />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {returned}/{total} barang kembali
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatDateTime } from '@/lib/date-utils';
import ItemDetailClient from './ItemDetailClient';

export const metadata: Metadata = { title: 'Detail Barang' };

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase.from('items').select('*').eq('id', id).single();
  if (!item) notFound();

  // Histori pemakaian
  const { data: history } = await supabase
    .from('surat_jalan_items')
    .select(`
      id, status_keluar, waktu_keluar, status_masuk, waktu_masuk,
      surat_jalan(id, nomor_sj, event_name, pic_name, status)
    `)
    .eq('item_id', id)
    .order('waktu_keluar', { ascending: false })
    .limit(20);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/barang" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">{item.name}</h1>
            <p className="page-subtitle">{item.category}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Info Card */}
          <div className="card">
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Informasi Barang</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {[
                { label: 'Nama', value: item.name },
                { label: 'Kategori', value: item.category },
                { label: 'QR Code', value: item.qr_code },
                { label: 'Kondisi', value: item.condition },
                { label: 'Status', value: item.status },
                { label: 'Ditambahkan', value: formatDate(item.created_at) },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#f1f5f9', fontWeight: 500 }}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
            {item.notes && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>Catatan</div>
                <div style={{ fontSize: '0.875rem' }}>{item.notes}</div>
              </div>
            )}
          </div>

          {/* Histori */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Histori Pemakaian</h2>
            </div>
            {!history || history.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <p>Belum pernah digunakan dalam surat jalan</p>
              </div>
            ) : (
              <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Surat Jalan</th>
                      <th>Event</th>
                      <th>PIC</th>
                      <th>Tgl Keluar</th>
                      <th>Tgl Kembali</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(history as unknown as Array<{
                      id: string;
                      waktu_keluar: string | null;
                      waktu_masuk: string | null;
                      surat_jalan: { id: string; nomor_sj: string; event_name: string; pic_name: string; status: string } | null;
                    }>).map(h => (
                      <tr key={h.id}>
                        <td>
                          {h.surat_jalan ? (
                            <Link href={`/surat-jalan/${h.surat_jalan.id}`} style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem' }}>
                              {h.surat_jalan.nomor_sj}
                            </Link>
                          ) : '-'}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{h.surat_jalan?.event_name ?? '-'}</td>
                        <td style={{ fontSize: '0.8rem' }}>{h.surat_jalan?.pic_name ?? '-'}</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDateTime(h.waktu_keluar)}</td>
                        <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{formatDateTime(h.waktu_masuk)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* QR Code & Foto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {item.photo_url && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.photo_url} alt={item.name} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
            </div>
          )}
          <ItemDetailClient item={item} />
        </div>
      </div>
    </div>
  );
}

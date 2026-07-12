'use client';

import type { Item } from '@/types';
import Link from 'next/link';
import { QrCode, Eye, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/date-utils';

const CONDITION_BADGE: Record<string, string> = {
  baik: 'badge-success',
  rusak: 'badge-danger',
  maintenance: 'badge-warning',
};
const STATUS_BADGE: Record<string, string> = {
  tersedia: 'badge-success',
  disewa: 'badge-warning',
  maintenance: 'badge-danger',
};

export default function ItemsTable({ items }: { items: Item[] }) {
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async (item: Item) => {
    if (!confirm(`Hapus barang "${item.name}"? Aksi ini tidak bisa dibatalkan.`)) return;

    const { error } = await supabase.from('items').delete().eq('id', item.id);
    if (error) {
      if (error.message.includes('surat_jalan_items_item_id_fkey')) {
        toast.error('Gagal menghapus: Barang masih tercatat di Surat Jalan. Hapus dari Surat Jalan terlebih dahulu.');
      } else {
        toast.error('Gagal menghapus: ' + error.message);
      }
    } else {
      toast.success('Barang dihapus');
      router.refresh();
    }
  };

  if (items.length === 0) {
    return (
      <div className="card empty-state">
        <QrCode size={48} style={{ opacity: 0.3 }} />
        <p>Belum ada barang. Tambah atau import dari Excel.</p>
        <Link href="/barang/baru" className="btn btn-primary btn-sm">Tambah Barang</Link>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Nama Barang</th>
            <th>Kategori</th>
            <th>QR Code</th>
            <th>Kondisi</th>
            <th>Status</th>
            <th>Ditambahkan</th>
            <th style={{ textAlign: 'right' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo_url}
                      alt={item.name}
                      style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '3px', flexShrink: 0,
                      background: 'var(--bg-tertiary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <QrCode size={16} color="var(--text-muted)" />
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
                    {item.notes && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{item.notes}</div>
                    )}
                  </div>
                </div>
              </td>
              <td>
                <span className="badge badge-muted">{item.category}</span>
              </td>
              <td>
                <code style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.02em' }}>
                  {item.qr_code}
                </code>
              </td>
              <td>
                <span className={`badge ${CONDITION_BADGE[item.condition] ?? 'badge-muted'}`}>
                  {item.condition}
                </span>
              </td>
              <td>
                <span className={`badge ${STATUS_BADGE[item.status] ?? 'badge-muted'}`}>
                  {item.status}
                </span>
              </td>
              <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: "'IBM Plex Mono', monospace" }}>
                {formatDate(item.created_at)}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                  <Link href={`/barang/${item.id}`} className="btn btn-ghost btn-icon btn-sm" title="Detail">
                    <Eye size={15} />
                  </Link>
                  <button
                    onClick={() => handleDelete(item)}
                    className="btn btn-ghost btn-icon btn-sm"
                    title="Hapus"
                    style={{ color: 'var(--danger)' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

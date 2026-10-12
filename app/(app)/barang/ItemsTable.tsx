'use client';

import { useState, useMemo } from 'react';
import type { Item } from '@/types';
import Link from 'next/link';
import {
  QrCode, Eye, Trash2, Pencil, Printer, Image as ImageIcon, Loader2,
  ArrowUpDown, ArrowUp, ArrowDown,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/date-utils';
import ItemImage from '@/components/ItemImage';
import { compressImage } from '@/lib/image-compression';

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

type SortField = 'name' | 'category' | 'qr_code' | 'condition' | 'status' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function ItemsTable({ items }: { items: Item[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [printType, setPrintType] = useState<'qr' | 'barcode'>('qr');
  const [isUploadingBulk, setIsUploadingBulk] = useState(false);

  // Sorting state - default nama ascending (A - Z, natural numeric sort)
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedItems = useMemo(() => {
    const list = [...items];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name, 'id', { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'category') {
        cmp = (a.category || '').localeCompare(b.category || '', 'id', { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'qr_code') {
        cmp = (a.qr_code || '').localeCompare(b.qr_code || '', 'id', { numeric: true, sensitivity: 'base' });
      } else if (sortField === 'condition') {
        cmp = (a.condition || '').localeCompare(b.condition || '', 'id', { sensitivity: 'base' });
      } else if (sortField === 'status') {
        cmp = (a.status || '').localeCompare(b.status || '', 'id', { sensitivity: 'base' });
      } else if (sortField === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [items, sortField, sortDirection]);

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.size} barang terpilih? Aksi ini tidak bisa dibatalkan.`)) return;
    
    const { error } = await supabase.from('items').delete().in('id', Array.from(selectedIds));
    if (error) {
      toast.error('Gagal menghapus sebagian/seluruh barang: ' + error.message);
    } else {
      toast.success(`${selectedIds.size} barang dihapus`);
      setSelectedIds(new Set());
      router.refresh();
    }
  };

  const handleBulkPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 15MB');
      return;
    }

    setIsUploadingBulk(true);
    try {
      // Optimasi dan kompres gambar otomatis
      const compressedFile = await compressImage(file, { maxWidth: 1200, quality: 0.82 });

      const fileExt = compressedFile.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const path = `bulk/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-photos')
        .upload(path, compressedFile, { upsert: true });

      if (uploadError) throw new Error(`Gagal upload foto: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(path);
      const photoUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('items')
        .update({ photo_url: photoUrl })
        .in('id', Array.from(selectedIds));

      if (updateError) throw new Error(`Gagal update database: ${updateError.message}`);

      toast.success(`Foto berhasil dioptimalkan dan diatur untuk ${selectedIds.size} barang`);
      setSelectedIds(new Set());
      router.refresh();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setIsUploadingBulk(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleBulkPrint = () => {
    const selectedItems = items.filter(i => selectedIds.has(i.id));
    if (selectedItems.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const scriptHtml = printType === 'qr' ? `
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <script>
        window.onload = () => {
          const items = ${JSON.stringify(selectedItems)};
          const grid = document.getElementById('grid');
          items.forEach((item, index) => {
            if (!item) return;
            const div = document.createElement('div');
            div.className = 'label qr';
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'canvas-container';
            const canvas = document.createElement('canvas');
            canvasContainer.appendChild(canvas);
            
            const title = document.createElement('h3');
            title.innerText = item.name;
            const pCode = document.createElement('p');
            pCode.innerText = item.qr_code;
            
            div.appendChild(canvasContainer);
            div.appendChild(title);
            div.appendChild(pCode);
            grid.appendChild(div);
            
            QRCode.toCanvas(canvas, item.qr_code, { width: 150, margin: 1 });
          });
          setTimeout(() => window.print(), 1000);
        };
      </script>
    ` : `
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script>
        window.onload = () => {
          const items = ${JSON.stringify(selectedItems)};
          const grid = document.getElementById('grid');
          items.forEach((item, index) => {
            if (!item) return;
            const div = document.createElement('div');
            div.className = 'label barcode';
            
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'barcode-' + index;
            
            const info = document.createElement('div');
            info.className = 'info';
            const title = document.createElement('h3');
            title.innerText = item.name;
            const pCode = document.createElement('p');
            pCode.innerText = item.category;
            
            info.appendChild(title);
            info.appendChild(pCode);
            
            div.appendChild(svg);
            div.appendChild(info);
            grid.appendChild(div);
            
            JsBarcode("#barcode-" + index, item.qr_code, {
              format: "CODE128", width: 1, height: 40, displayValue: true, fontSize: 10, margin: 0
            });
          });
          setTimeout(() => window.print(), 1000);
        };
      </script>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Batch Print Labels</title>
        <style>
          body { font-family: sans-serif; padding: 16px; background: white; margin: 0; }
          .header { font-size: 14px; margin-bottom: 16px; text-align: center; font-weight: bold; }
          .grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
          
          .label { border: 1px solid #000; padding: 6px; text-align: center; }
          .label.qr { width: 120px; border-radius: 4px; }
          .label.barcode { width: 260px; border-radius: 4px; display: flex; align-items: center; gap: 8px; padding: 6px 8px; }
          .label.barcode .info { text-align: left; flex: 1; }
          
          h3 { margin: 0 0 2px; font-size: 10px; font-weight: 700; word-break: break-word; }
          p { margin: 2px 0 0; font-size: 8px; color: #333; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .canvas-container { display: flex; justify-content: center; margin-bottom: 4px; }
          .canvas-container canvas { width: 90px !important; height: 90px !important; }
          
          @media print { 
            body { padding: 0; }
            .header { display: none; }
            .grid { gap: 4px; justify-content: flex-start; }
            .label { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">Cetak Label Massal</div>
        <div class="grid" id="grid"></div>
        ${scriptHtml}
      </body>
      </html>
    `);

    printWindow.document.close();
  };

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
    <div>
      {selectedIds.size > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.875rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, flex: '1 1 auto', minWidth: '150px' }}>
            {selectedIds.size} barang terpilih
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', flex: '1 1 auto', justifyContent: 'flex-end' }}>
            <select 
              value={printType} 
              onChange={e => setPrintType(e.target.value as 'qr' | 'barcode')}
              className="select"
              style={{ minHeight: '32px', height: '32px', fontSize: '0.8rem', flex: '1 1 120px', padding: '0 2rem 0 0.75rem', maxWidth: '200px' }}
            >
              <option value="qr">QR Code</option>
              <option value="barcode">Barcode</option>
            </select>
            <button onClick={handleBulkPrint} className="btn btn-primary btn-sm" style={{ height: '32px', flex: '1 1 70px', justifyContent: 'center', maxWidth: '100px' }}>
              <Printer size={14} /> Print
            </button>
            
            <label className="btn btn-secondary btn-sm" style={{ height: '32px', flex: '1 1 100px', justifyContent: 'center', maxWidth: '130px', margin: 0, cursor: isUploadingBulk ? 'not-allowed' : 'pointer' }}>
              {isUploadingBulk ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ImageIcon size={14} />}
              {isUploadingBulk ? 'Upload...' : 'Set Foto'}
              <input type="file" accept="image/*" onChange={handleBulkPhotoUpload} disabled={isUploadingBulk} style={{ display: 'none' }} />
            </label>

            <button onClick={handleBulkDelete} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', height: '32px', flex: '1 1 70px', justifyContent: 'center', maxWidth: '100px' }}>
              <Trash2 size={14} /> Hapus
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={sortedItems.length > 0 && selectedIds.size === sortedItems.length}
                  onChange={toggleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th
                className="sortable-th"
                onClick={() => {
                  if (sortField === 'name') {
                    setSortDirection(p => (p === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortField('name');
                    setSortDirection('asc');
                  }
                }}
                title={`Urutkan Nama (${sortField === 'name' && sortDirection === 'asc' ? 'Z - A' : 'A - Z'})`}
              >
                <span className="sort-header-inner">
                  <span>Nama Barang</span>
                  {sortField === 'name' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={13} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <ArrowDown size={13} style={{ color: 'var(--accent)' }} />
                    )
                  ) : (
                    <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                  )}
                </span>
              </th>
              <th
                className="sortable-th hide-mobile"
                onClick={() => {
                  if (sortField === 'category') {
                    setSortDirection(p => (p === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortField('category');
                    setSortDirection('asc');
                  }
                }}
                title="Urutkan Kategori"
              >
                <span className="sort-header-inner">
                  <span>Kategori</span>
                  {sortField === 'category' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={13} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <ArrowDown size={13} style={{ color: 'var(--accent)' }} />
                    )
                  ) : (
                    <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                  )}
                </span>
              </th>
              <th
                className="sortable-th hide-mobile"
                onClick={() => {
                  if (sortField === 'qr_code') {
                    setSortDirection(p => (p === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortField('qr_code');
                    setSortDirection('asc');
                  }
                }}
                title="Urutkan QR Code"
              >
                <span className="sort-header-inner">
                  <span>QR Code</span>
                  {sortField === 'qr_code' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={13} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <ArrowDown size={13} style={{ color: 'var(--accent)' }} />
                    )
                  ) : (
                    <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                  )}
                </span>
              </th>
              <th
                className="sortable-th hide-mobile"
                onClick={() => {
                  if (sortField === 'condition') {
                    setSortDirection(p => (p === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortField('condition');
                    setSortDirection('asc');
                  }
                }}
                title="Urutkan Kondisi"
              >
                <span className="sort-header-inner">
                  <span>Kondisi</span>
                  {sortField === 'condition' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={13} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <ArrowDown size={13} style={{ color: 'var(--accent)' }} />
                    )
                  ) : (
                    <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                  )}
                </span>
              </th>
              <th
                className="sortable-th"
                onClick={() => {
                  if (sortField === 'status') {
                    setSortDirection(p => (p === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortField('status');
                    setSortDirection('asc');
                  }
                }}
                title="Urutkan Status"
              >
                <span className="sort-header-inner">
                  <span>Status</span>
                  {sortField === 'status' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={13} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <ArrowDown size={13} style={{ color: 'var(--accent)' }} />
                    )
                  ) : (
                    <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                  )}
                </span>
              </th>
              <th
                className="sortable-th hide-mobile"
                onClick={() => {
                  if (sortField === 'created_at') {
                    setSortDirection(p => (p === 'asc' ? 'desc' : 'asc'));
                  } else {
                    setSortField('created_at');
                    setSortDirection('asc');
                  }
                }}
                title="Urutkan Tanggal Ditambahkan"
              >
                <span className="sort-header-inner">
                  <span>Ditambahkan</span>
                  {sortField === 'created_at' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp size={13} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <ArrowDown size={13} style={{ color: 'var(--accent)' }} />
                    )
                  ) : (
                    <ArrowUpDown size={12} style={{ opacity: 0.35 }} />
                  )}
                </span>
              </th>
              <th className="sticky-col-right" style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map(item => (
              <tr key={item.id} style={{ background: selectedIds.has(item.id) ? 'rgba(56, 189, 248, 0.05)' : undefined }}>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ItemImage src={item.photo_url} alt={item.name} size={36} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</div>
                      {item.notes && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>{item.notes}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="hide-mobile">
                  <span className="badge badge-muted">{item.category}</span>
                </td>
                <td className="hide-mobile">
                  <code style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.2rem 0.5rem', borderRadius: '3px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.02em' }}>
                    {item.qr_code}
                  </code>
                </td>
                <td className="hide-mobile">
                  <span className={`badge ${CONDITION_BADGE[item.condition] ?? 'badge-muted'}`}>
                    {item.condition}
                  </span>
                </td>
                <td>
                  <span className={`badge ${STATUS_BADGE[item.status] ?? 'badge-muted'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="hide-mobile" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatDate(item.created_at)}
                </td>
                <td className="sticky-col-right" style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                    <Link href={`/barang/${item.id}`} className="btn btn-ghost btn-icon btn-sm" title="Detail">
                      <Eye size={15} />
                    </Link>
                    <Link href={`/barang/${item.id}/edit`} className="btn btn-ghost btn-icon btn-sm" title="Edit">
                      <Pencil size={15} />
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
    </div>
  );
}

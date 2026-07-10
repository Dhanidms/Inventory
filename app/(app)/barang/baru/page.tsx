'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { generateQRCode } from '@/lib/qr-utils';
import { toast } from 'sonner';
import { QrCode, Upload, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ItemCondition } from '@/types';

const CATEGORIES = [
  'LED Screen', 'Broadcast Camera', 'Audio', 'Lighting', 'Cable & Power',
  'Truss & Structure', 'Control & Signal', 'Wireless', 'Lainnya'
];

export default function TambahBarangForm() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    customCategory: '',
    condition: 'baik' as ItemCondition,
    notes: '',
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran foto maksimal 5MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nama barang wajib diisi'); return; }
    const cat = form.category === 'Lainnya' ? form.customCategory : form.category;
    if (!cat.trim()) { toast.error('Kategori wajib diisi'); return; }

    setLoading(true);
    try {
      const qrCode = generateQRCode();
      let photoUrl: string | null = null;

      // Upload foto ke Supabase Storage
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const path = `items/${qrCode}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('item-photos')
          .upload(path, photoFile, { upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(path);
          photoUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase.from('items').insert({
        name: form.name.trim(),
        category: cat.trim(),
        condition: form.condition,
        notes: form.notes.trim() || null,
        qr_code: qrCode,
        photo_url: photoUrl,
        status: 'tersedia',
      });

      if (error) throw error;

      toast.success('Barang berhasil ditambahkan!');
      router.push('/barang');
      router.refresh();
    } catch (err: unknown) {
      toast.error('Gagal menyimpan: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/barang" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Tambah Barang Baru</h1>
            <p className="page-subtitle">QR code akan digenerate otomatis</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '600px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Foto */}
          <div className="card">
            <label className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Foto Barang</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '10px',
                background: 'var(--bg-tertiary)',
                border: '2px dashed var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', flexShrink: 0,
              }}>
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <QrCode size={28} color="#64748b" />
                )}
              </div>
              <div>
                <label htmlFor="photo-upload" className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  <Upload size={14} />
                  {photoPreview ? 'Ganti Foto' : 'Upload Foto'}
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                  JPG/PNG, maks 5MB. Bisa foto pakai kamera HP.
                </p>
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Nama */}
            <div className="form-group">
              <label className="label" htmlFor="name">Nama Barang *</label>
              <input
                id="name"
                className="input"
                placeholder="cth: LED Screen P3 4x3m"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>

            {/* Kategori */}
            <div className="form-group">
              <label className="label" htmlFor="category">Kategori *</label>
              <select
                id="category"
                className="select"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                required
              >
                <option value="">Pilih Kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {form.category === 'Lainnya' && (
                <input
                  className="input"
                  placeholder="Ketik kategori baru..."
                  style={{ marginTop: '0.5rem' }}
                  value={form.customCategory}
                  onChange={e => setForm(p => ({ ...p, customCategory: e.target.value }))}
                />
              )}
            </div>

            {/* Kondisi */}
            <div className="form-group">
              <label className="label">Kondisi *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['baik', 'rusak', 'maintenance'] as ItemCondition[]).map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, condition: c }))}
                    className="btn btn-sm"
                    style={{
                      background: form.condition === c
                        ? c === 'baik' ? 'rgba(16,185,129,0.2)' : c === 'rusak' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'
                        : 'var(--bg-tertiary)',
                      color: form.condition === c
                        ? c === 'baik' ? '#10b981' : c === 'rusak' ? '#ef4444' : '#f59e0b'
                        : '#94a3b8',
                      border: `1px solid ${form.condition === c
                        ? c === 'baik' ? '#10b981' : c === 'rusak' ? '#ef4444' : '#f59e0b'
                        : 'var(--border)'}`,
                      textTransform: 'capitalize',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan */}
            <div className="form-group">
              <label className="label" htmlFor="notes">Catatan</label>
              <textarea
                id="notes"
                className="textarea"
                placeholder="Catatan tambahan (opsional)"
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/barang" className="btn btn-secondary" style={{ flex: 1 }}>Batal</Link>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Menyimpan...</> : 'Simpan Barang'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

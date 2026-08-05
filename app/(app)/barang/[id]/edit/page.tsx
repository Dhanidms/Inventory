'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { QrCode, Upload, Loader2, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import type { ItemCondition, ItemStatus } from '@/types';

interface Category { id: string; name: string; color: string; icon: string; }

export default function EditBarangForm() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState({
    name: '',
    category: '',
    condition: 'baik' as ItemCondition,
    status: 'tersedia' as ItemStatus,
    notes: '',
  });

  // Load categories and item from DB
  useEffect(() => {
    const loadData = async () => {
      // Get categories
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, color, icon')
        .order('created_at', { ascending: true });
      if (catData) setCategories(catData);

      // Get item
      const { data: itemData, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error || !itemData) {
        toast.error('Gagal mengambil data barang');
        router.push('/barang');
        return;
      }

      setForm({
        name: itemData.name,
        category: itemData.category,
        condition: itemData.condition as ItemCondition,
        status: itemData.status as ItemStatus,
        notes: itemData.notes || '',
      });
      setPhotoPreview(itemData.photo_url);
      setFetching(false);
    };

    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
    if (!form.category.trim()) { toast.error('Kategori wajib diisi'); return; }
    
    setLoading(true);
    try {
      let photoUrl: string | null | undefined = undefined;

      // Upload foto ke Supabase Storage if a new one is selected
      if (photoFile) {
        // We get the item's qr code to name the photo consistently
        const { data: currentItem } = await supabase.from('items').select('qr_code').eq('id', id).single();
        if (currentItem) {
          const ext = photoFile.name.split('.').pop();
          const path = `items/${currentItem.qr_code}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('item-photos')
            .upload(path, photoFile, { upsert: true });

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('item-photos').getPublicUrl(path);
            photoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          }
        }
      }

      const updateData: any = {
        name: form.name.trim(),
        category: form.category,
        condition: form.condition,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (photoUrl !== undefined) {
        updateData.photo_url = photoUrl;
      }

      const { error } = await supabase.from('items').update(updateData).eq('id', id);

      if (error) throw error;

      toast.success('Barang berhasil diperbarui!');
      router.push(`/barang/${id}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error('Gagal menyimpan: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 className="spinner" size={24} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href={`/barang/${id}`} className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Edit Barang</h1>
            <p className="page-subtitle">Ubah informasi barang</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="label" htmlFor="category">Kategori *</label>
                <Link href="/kategori" className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                  <Plus size={11} /> Kelola Kategori
                </Link>
              </div>
              <select
                id="category"
                className="select"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                required
              >
                <option value="">
                  {categories.length === 0 ? 'Memuat kategori...' : 'Pilih Kategori'}
                </option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.icon} {c.name}</option>
                ))}
              </select>
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

            {/* Status */}
            <div className="form-group">
              <label className="label">Status *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['tersedia', 'disewa', 'maintenance'] as ItemStatus[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, status: s }))}
                    className="btn btn-sm"
                    style={{
                      background: form.status === s
                        ? s === 'tersedia' ? 'rgba(16,185,129,0.2)' : s === 'maintenance' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'
                        : 'var(--bg-tertiary)',
                      color: form.status === s
                        ? s === 'tersedia' ? '#10b981' : s === 'maintenance' ? '#ef4444' : '#f59e0b'
                        : '#94a3b8',
                      border: `1px solid ${form.status === s
                        ? s === 'tersedia' ? '#10b981' : s === 'maintenance' ? '#ef4444' : '#f59e0b'
                        : 'var(--border)'}`,
                      textTransform: 'capitalize',
                    }}
                  >
                    {s}
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
            <Link href={`/barang/${id}`} className="btn btn-secondary" style={{ flex: 1 }}>Batal</Link>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Menyimpan...</> : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

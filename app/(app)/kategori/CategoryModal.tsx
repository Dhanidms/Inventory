'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

const PRESET_COLORS = [
  '#4a90c4', '#49b7ab', '#f2a638', '#e0553a', '#7c6fe0',
  '#e06fbe', '#5dba74', '#f2c438', '#9aa19f', '#6b7170',
  '#e8825a', '#5ab0e8',
];

const PRESET_ICONS = [
  '📦', '🖥️', '📷', '🎙️', '💡', '🔌', '🏗️', '🎛️',
  '📡', '🎬', '🔧', '⚡', '🎤', '📺', '🔊', '🎯',
  '📹', '🔋', '🖱️', '🎚️',
];

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

interface CategoryModalProps {
  category?: Category | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function CategoryModal({ category, onClose, onSaved }: CategoryModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: category?.name ?? '',
    color: category?.color ?? '#4a90c4',
    icon: category?.icon ?? '📦',
  });
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Nama kategori wajib diisi'); return; }

    setLoading(true);
    try {
      if (category) {
        // Edit
        const { error } = await supabase
          .from('categories')
          .update({ name: form.name.trim(), color: form.color, icon: form.icon })
          .eq('id', category.id);
        if (error) throw error;

        // Sync nama kategori di tabel items jika nama berubah
        if (category.name !== form.name.trim()) {
          await supabase
            .from('items')
            .update({ category: form.name.trim() })
            .eq('category', category.name);
        }
        toast.success('Kategori berhasil diperbarui');
      } else {
        // Tambah baru
        const { error } = await supabase
          .from('categories')
          .insert({ name: form.name.trim(), color: form.color, icon: form.icon });
        if (error) {
          if (error.message.includes('unique') || error.message.includes('duplicate')) {
            toast.error('Nama kategori sudah ada');
            return;
          }
          throw error;
        }
        toast.success('Kategori berhasil ditambahkan');
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error('Gagal menyimpan: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          animation: 'fadeIn 0.15s ease',
        }}
      >
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          width: '100%',
          maxWidth: '440px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideUp 0.2s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '1.25rem 1.25rem 0',
          }}>
            <div>
              <h2 style={{ margin: 0, fontFamily: "'Oswald', sans-serif", fontSize: '1.1rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {category ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {category ? 'Perubahan nama akan tersinkron ke semua barang' : 'Kategori baru akan muncul di dropdown barang'}
              </p>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ flexShrink: 0 }}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Preview */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                borderRadius: '6px',
                border: '1px solid var(--border)',
              }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '10px',
                  background: form.color + '22',
                  border: `2px solid ${form.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}>
                  {form.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: form.color, fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em' }}>
                    {form.name || 'Nama Kategori'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Preview kategori</div>
                </div>
              </div>

              {/* Nama */}
              <div className="form-group">
                <label className="label" htmlFor="cat-name">Nama Kategori *</label>
                <input
                  id="cat-name"
                  className="input"
                  placeholder="cth: LED Screen"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              {/* Icon */}
              <div className="form-group">
                <label className="label">Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {PRESET_ICONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, icon }))}
                      style={{
                        width: '36px', height: '36px',
                        borderRadius: '6px',
                        border: form.icon === icon ? `2px solid ${form.color}` : '1.5px solid var(--border)',
                        background: form.icon === icon ? form.color + '22' : 'var(--bg-tertiary)',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                        transform: form.icon === icon ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Warna */}
              <div className="form-group">
                <label className="label">Warna</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, color }))}
                      style={{
                        width: '28px', height: '28px',
                        borderRadius: '50%',
                        background: color,
                        border: form.color === color ? '3px solid white' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                        transform: form.color === color ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: form.color === color ? `0 0 0 2px ${color}` : 'none',
                      }}
                    >
                      {form.color === color && <Check size={12} color="white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', gap: '0.75rem',
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                Batal
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 2 }}>
                {loading ? <><Loader2 size={15} style={{ animation: 'spin 0.6s linear infinite' }} /> Menyimpan...</> : category ? 'Simpan Perubahan' : 'Tambah Kategori'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </>
  );
}

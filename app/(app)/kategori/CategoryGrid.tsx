'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Pencil, Trash2, Plus, Tag, Package } from 'lucide-react';
import CategoryModal from './CategoryModal';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
}

interface CategoryGridProps {
  categories: Category[];
  itemCountMap: Record<string, number>;
}

export default function CategoryGrid({ categories: initialCategories, itemCountMap }: CategoryGridProps) {
  const supabase = createClient();
  const [categories, setCategories] = useState(initialCategories);
  const [counts, setCounts] = useState(itemCountMap);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refresh = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setCategories(data);

    // Refresh counts
    const { data: items } = await supabase.from('items').select('category');
    if (items) {
      const map: Record<string, number> = {};
      items.forEach(i => { map[i.category] = (map[i.category] || 0) + 1; });
      setCounts(map);
    }
  };

  const handleDelete = async (cat: Category) => {
    const count = counts[cat.name] || 0;
    const msg = count > 0
      ? `Kategori "${cat.name}" digunakan oleh ${count} barang. Barang tersebut tidak akan terhapus, namun kategorinya perlu di-reassign. Lanjutkan?`
      : `Hapus kategori "${cat.name}"?`;

    if (!confirm(msg)) return;

    setDeletingId(cat.id);
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) {
      toast.error('Gagal menghapus: ' + error.message);
    } else {
      toast.success(`Kategori "${cat.name}" dihapus`);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
    }
    setDeletingId(null);
  };

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (cat: Category) => { setEditTarget(cat); setModalOpen(true); };

  return (
    <>
      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.25rem' }}>
        <button onClick={openAdd} className="btn btn-primary btn-sm">
          <Plus size={14} />
          Tambah Kategori
        </button>
      </div>

      {/* Grid */}
      {categories.length === 0 ? (
        <div className="card empty-state">
          <Tag size={48} style={{ opacity: 0.3 }} />
          <p>Belum ada kategori. Tambah kategori baru untuk mulai.</p>
          <button onClick={openAdd} className="btn btn-primary btn-sm">
            <Plus size={14} /> Tambah Kategori
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1rem',
        }}>
          {categories.map(cat => {
            const count = counts[cat.name] || 0;
            const isDeleting = deletingId === cat.id;
            return (
              <div
                key={cat.id}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${cat.color}33`,
                  borderRadius: '8px',
                  padding: '1.25rem',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
                  cursor: 'default',
                  opacity: isDeleting ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${cat.color}22`;
                  (e.currentTarget as HTMLElement).style.borderColor = cat.color + '66';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                  (e.currentTarget as HTMLElement).style.borderColor = cat.color + '33';
                }}
              >
                {/* Accent strip */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${cat.color}, ${cat.color}88)`,
                  borderRadius: '8px 8px 0 0',
                }} />

                {/* Icon + nama */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', marginBottom: '1rem' }}>
                  <div style={{
                    width: '48px', height: '48px',
                    borderRadius: '10px',
                    background: cat.color + '1a',
                    border: `1.5px solid ${cat.color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0,
                  }}>
                    {cat.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Oswald', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      color: cat.color,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {cat.name}
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem',
                    }}>
                      <Package size={11} />
                      {count} barang
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{
                  display: 'flex', gap: '0.5rem',
                  borderTop: '1px solid var(--border)',
                  paddingTop: '0.875rem',
                }}>
                  <button
                    onClick={() => openEdit(cat)}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem' }}
                    disabled={isDeleting}
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
                    className="btn btn-ghost btn-sm"
                    style={{ flex: 1, fontSize: '0.75rem', color: 'var(--danger)' }}
                    disabled={isDeleting}
                  >
                    <Trash2 size={13} />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <CategoryModal
          category={editTarget}
          onClose={() => setModalOpen(false)}
          onSaved={refresh}
        />
      )}
    </>
  );
}

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Tag } from 'lucide-react';
import CategoryGrid from './CategoryGrid';

export const metadata: Metadata = { title: 'Manajemen Kategori' };

export default async function KategoriPage() {
  const supabase = await createClient();

  // Ambil semua kategori
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: true });

  // Hitung jumlah barang per kategori
  const { data: items } = await supabase.from('items').select('category');
  const itemCountMap: Record<string, number> = {};
  items?.forEach(i => {
    itemCountMap[i.category] = (itemCountMap[i.category] || 0) + 1;
  });

  const totalBarang = items?.length ?? 0;
  const totalKategori = categories?.length ?? 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Kategori</h1>
          <p className="page-subtitle">
            {totalKategori} kategori · {totalBarang} total barang
          </p>
        </div>
      </div>

      {/* Stats summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card card-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '6px',
            background: 'rgba(242,166,56,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Tag size={18} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>
              {totalKategori}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Kategori</div>
          </div>
        </div>

        {(categories ?? []).map(cat => {
          const count = itemCountMap[cat.name] || 0;
          return (
            <div key={cat.id} className="card card-sm" style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              borderLeft: `3px solid ${cat.color}`,
            }}>
              <div style={{ fontSize: '1.25rem' }}>{cat.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1, color: cat.color }}>
                  {count}
                </div>
                <div style={{
                  fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.15rem',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {cat.name}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
        <CategoryGrid categories={categories ?? []} itemCountMap={itemCountMap} />
      </div>
    </div>
  );
}

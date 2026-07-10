import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Plus, Upload, Search } from 'lucide-react';
import ItemsTable from './ItemsTable';

export const metadata: Metadata = { title: 'Manajemen Barang' };

export default async function BarangPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const { q, kategori, status } = params;

  let query = supabase.from('items').select('*').order('created_at', { ascending: false });

  if (q) query = query.ilike('name', `%${q}%`);
  if (kategori) query = query.eq('category', kategori);
  if (status) query = query.eq('status', status);

  const { data: items } = await query;

  // Get unique categories
  const { data: allItems } = await supabase.from('items').select('category');
  const categories = [...new Set(allItems?.map(i => i.category) ?? [])].sort();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manajemen Barang</h1>
          <p className="page-subtitle">{items?.length ?? 0} barang terdaftar</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link href="/barang/import" className="btn btn-secondary btn-sm">
            <Upload size={14} />
            Import Excel
          </Link>
          <Link href="/barang/baru" className="btn btn-primary btn-sm">
            <Plus size={14} />
            Tambah Barang
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1rem', padding: '0.875rem' }}>
        <form style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Cari nama barang..."
              className="input"
              style={{ paddingLeft: '2.25rem' }}
            />
          </div>
          <select name="kategori" defaultValue={kategori} className="select" style={{ minWidth: '140px' }}>
            <option value="">Semua Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="status" defaultValue={status} className="select" style={{ minWidth: '120px' }}>
            <option value="">Semua Status</option>
            <option value="tersedia">Tersedia</option>
            <option value="disewa">Disewa</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm">Filter</button>
          <Link href="/barang" className="btn btn-ghost btn-sm">Reset</Link>
        </form>
      </div>

      <ItemsTable items={items ?? []} />
    </div>
  );
}

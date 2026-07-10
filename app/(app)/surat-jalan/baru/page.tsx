'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X, Search, Loader2, QrCode } from 'lucide-react';
import Link from 'next/link';
import type { Item, User } from '@/types';

export default function BuatSuratJalanPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchItem, setSearchItem] = useState('');
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [nomorSJ, setNomorSJ] = useState('');

  const [form, setForm] = useState({
    pic_user_id: '',
    pic_name: '',
    pic_phone: '',
    event_name: '',
    tanggal_ambil: new Date().toISOString().split('T')[0],
    tanggal_rencana_kembali: '',
    notes: '',
  });

  useEffect(() => {
    // Generate nomor SJ
    const fetchNomor = async () => {
      const year = new Date().getFullYear();
      const { data } = await supabase
        .from('surat_jalan')
        .select('nomor_sj')
        .ilike('nomor_sj', `SJ/${year}/%`)
        .order('nomor_sj', { ascending: false })
        .limit(1);

      const last = data?.[0]?.nomor_sj;
      if (last) {
        const num = parseInt(last.split('/').pop() ?? '0', 10) + 1;
        setNomorSJ(`SJ/${year}/${String(num).padStart(3, '0')}`);
      } else {
        setNomorSJ(`SJ/${year}/001`);
      }
    };

    // Load items & users
    const loadData = async () => {
      const [{ data: itemsData }, { data: usersData }] = await Promise.all([
        supabase.from('items').select('*').eq('status', 'tersedia').order('name'),
        supabase.from('users').select('id, name, email, role').eq('is_active', true).order('name'),
      ]);
      setItems(itemsData ?? []);
      setUsers((usersData ?? []) as unknown as User[]);
    };

    fetchNomor();
    loadData();
  }, [supabase]);

  const filteredItems = items.filter(i =>
    !selectedItems.find(s => s.id === i.id) &&
    (i.name.toLowerCase().includes(searchItem.toLowerCase()) ||
     i.category.toLowerCase().includes(searchItem.toLowerCase()) ||
     i.qr_code.toLowerCase().includes(searchItem.toLowerCase()))
  );

  const handlePICChange = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setForm(p => ({
      ...p,
      pic_user_id: userId,
      pic_name: user?.name ?? p.pic_name,
    }));
  };

  const addItem = (item: Item) => {
    setSelectedItems(p => [...p, item]);
    setSearchItem('');
  };

  const removeItem = (id: string) => {
    setSelectedItems(p => p.filter(i => i.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.event_name.trim()) { toast.error('Nama event wajib diisi'); return; }
    if (!form.pic_name.trim()) { toast.error('Nama PIC wajib diisi'); return; }
    if (!form.pic_phone.trim()) { toast.error('No HP PIC wajib diisi'); return; }
    if (!form.tanggal_rencana_kembali) { toast.error('Tanggal rencana kembali wajib diisi'); return; }
    if (selectedItems.length === 0) { toast.error('Tambahkan minimal 1 barang ke surat jalan'); return; }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: sj, error: sjError } = await supabase
        .from('surat_jalan')
        .insert({
          nomor_sj: nomorSJ,
          pic_user_id: form.pic_user_id || null,
          pic_name: form.pic_name.trim(),
          pic_phone: form.pic_phone.trim(),
          event_name: form.event_name.trim(),
          tanggal_ambil: form.tanggal_ambil,
          tanggal_rencana_kembali: form.tanggal_rencana_kembali,
          notes: form.notes.trim() || null,
          status: 'draft',
          created_by: user!.id,
        })
        .select()
        .single();

      if (sjError) throw sjError;

      const sjItems = selectedItems.map(item => ({
        surat_jalan_id: sj.id,
        item_id: item.id,
        status_keluar: false,
        status_masuk: false,
      }));

      const { error: itemsError } = await supabase.from('surat_jalan_items').insert(sjItems);
      if (itemsError) throw itemsError;

      toast.success(`Surat jalan ${nomorSJ} berhasil dibuat!`);
      router.push(`/surat-jalan/${sj.id}`);
      router.refresh();
    } catch (err: unknown) {
      toast.error('Gagal membuat surat jalan: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/surat-jalan" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Buat Surat Jalan Baru</h1>
            <p className="page-subtitle" style={{ color: '#818cf8', fontWeight: 600 }}>{nomorSJ}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.25rem', alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Info Event */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Informasi Event</h2>

              <div className="form-group">
                <label className="label" htmlFor="event_name">Nama Event *</label>
                <input id="event_name" className="input" placeholder="cth: Wedding Budi & Ani" value={form.event_name} onChange={e => setForm(p => ({ ...p, event_name: e.target.value }))} required />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="label" htmlFor="tanggal_ambil">Tanggal Ambil *</label>
                  <input id="tanggal_ambil" type="date" className="input" value={form.tanggal_ambil} onChange={e => setForm(p => ({ ...p, tanggal_ambil: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="tanggal_kembali">Rencana Kembali *</label>
                  <input id="tanggal_kembali" type="date" className="input" value={form.tanggal_rencana_kembali} min={form.tanggal_ambil} onChange={e => setForm(p => ({ ...p, tanggal_rencana_kembali: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="label" htmlFor="notes">Catatan</label>
                <textarea id="notes" className="textarea" placeholder="Catatan tambahan (opsional)" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            {/* Info PIC */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Penanggung Jawab (PIC)</h2>

              <div className="form-group">
                <label className="label" htmlFor="pic_user">Akun PIC (opsional)</label>
                <select id="pic_user" className="select" value={form.pic_user_id} onChange={e => handlePICChange(e.target.value)}>
                  <option value="">-- Pilih user / isi manual --</option>
                  {users.filter(u => u.role === 'pic' || u.role === 'admin').map(u => (
                    <option key={u.id} value={u.id}>{u.name || u.email}</option>
                  ))}
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="label" htmlFor="pic_name">Nama PIC *</label>
                  <input id="pic_name" className="input" placeholder="Nama lengkap PIC" value={form.pic_name} onChange={e => setForm(p => ({ ...p, pic_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="pic_phone">No HP PIC *</label>
                  <input id="pic_phone" type="tel" className="input" placeholder="08xxxxxxxxxx" value={form.pic_phone} onChange={e => setForm(p => ({ ...p, pic_phone: e.target.value }))} required inputMode="tel" />
                </div>
              </div>
            </div>
          </div>

          {/* Right column — Item picker */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'sticky', top: '80px' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                Barang <span style={{ color: '#818cf8' }}>({selectedItems.length})</span>
              </h2>
            </div>

            {/* Search */}
            <div style={{ padding: '0.875rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  className="input"
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="Cari barang tersedia..."
                  value={searchItem}
                  onChange={e => setSearchItem(e.target.value)}
                />
              </div>
            </div>

            {/* Item suggestions */}
            {searchItem && (
              <div style={{ maxHeight: '200px', overflowY: 'auto', borderBottom: '1px solid var(--border)' }}>
                {filteredItems.slice(0, 10).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 1.25rem', background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left',
                      transition: 'background 0.1s', fontSize: '0.875rem',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
                    <Plus size={14} color="#10b981" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.category}</div>
                    </div>
                  </button>
                ))}
                {filteredItems.length === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>Tidak ada barang tersedia</div>
                )}
              </div>
            )}

            {/* Selected items */}
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {selectedItems.length === 0 ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <QrCode size={32} />
                  <p style={{ fontSize: '0.8rem' }}>Cari dan tambah barang di atas</p>
                </div>
              ) : (
                selectedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 1.25rem',
                      borderBottom: idx < selectedItems.length - 1 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{item.category}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="btn btn-ghost btn-icon btn-sm"
                      style={{ color: '#ef4444', flexShrink: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Submit */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
              <button
                type="submit"
                disabled={loading || selectedItems.length === 0}
                className="btn btn-primary btn-full"
              >
                {loading ? (
                  <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Menyimpan...</>
                ) : (
                  `Buat Surat Jalan (${selectedItems.length} barang)`
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

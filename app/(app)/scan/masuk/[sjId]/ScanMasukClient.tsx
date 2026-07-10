'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Keyboard, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SJItem {
  id: string;
  item_id: string;
  status_masuk: boolean;
  item: { id: string; name: string; category: string; qr_code: string } | null;
}

export default function ScanMasukClient({ sjId }: { sjId: string }) {
  const supabase = createClient();
  const [sj, setSJ] = useState<{ nomor_sj: string; event_name: string; pic_name: string } | null>(null);
  const [items, setItems] = useState<SJItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'hid' | 'camera'>('hid');
  const [hidInput, setHidInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastScan, setLastScan] = useState<{ code: string; status: 'ok' | 'warn'; msg: string } | null>(null);
  const hidRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<{ clear: () => void } | null>(null);

  const loadData = useCallback(async () => {
    const { data: sjData } = await supabase.from('surat_jalan').select('nomor_sj, event_name, pic_name').eq('id', sjId).single();
    setSJ(sjData);
    const { data: itemsData } = await supabase
      .from('surat_jalan_items')
      .select('id, item_id, status_masuk, item:items(id, name, category, qr_code)')
      .eq('surat_jalan_id', sjId);
    setItems((itemsData ?? []) as unknown as SJItem[]);
    setLoading(false);
  }, [supabase, sjId]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (mode === 'hid') hidRef.current?.focus(); }, [mode]);

  const processQRCode = useCallback(async (qrCode: string) => {
    if (processing) return;
    const code = qrCode.trim();
    if (!code) return;

    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();

    const sjItem = items.find(i => i.item?.qr_code === code);

    if (!sjItem) {
      setLastScan({ code, status: 'warn', msg: '⚠️ Barang tidak ada dalam surat jalan ini!' });
      toast.warning('Barang tidak ditemukan dalam surat jalan ini!');
      setProcessing(false);
      return;
    }

    if (sjItem.status_masuk) {
      setLastScan({ code, status: 'warn', msg: `⚠️ ${sjItem.item?.name} sudah dicatat kembali` });
      toast.warning(`${sjItem.item?.name} sudah discan masuk`);
      setProcessing(false);
      return;
    }

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('surat_jalan_items')
      .update({ status_masuk: true, waktu_masuk: now })
      .eq('id', sjItem.id);

    if (error) {
      toast.error('Gagal update: ' + error.message);
      setProcessing(false);
      return;
    }

    // Update item status ke tersedia
    await supabase.from('items').update({ status: 'tersedia' }).eq('id', sjItem.item_id);

    // Log scan
    await supabase.from('scan_logs').insert({
      item_id: sjItem.item_id,
      surat_jalan_id: sjId,
      action: 'masuk',
      scanned_by: user!.id,
    });

    setLastScan({ code, status: 'ok', msg: `✓ ${sjItem.item?.name} — KEMBALI` });
    toast.success(`${sjItem.item?.name} berhasil dicatat kembali!`);

    await loadData();

    // Check if all returned
    const updatedItems = items.map(i => i.id === sjItem.id ? { ...i, status_masuk: true } : i);
    const allReturned = updatedItems.every(i => i.status_masuk);
    if (allReturned) {
      await supabase.from('surat_jalan').update({
        status: 'selesai',
        tanggal_aktual_kembali: now,
      }).eq('id', sjId);
      toast.success('🎉 Semua barang sudah kembali! Surat jalan SELESAI.', { duration: 6000 });
    } else {
      await supabase.from('surat_jalan').update({ status: 'sebagian_kembali' }).eq('id', sjId);
    }

    setProcessing(false);
  }, [items, processing, sjId, supabase, loadData]);

  const handleHIDSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processQRCode(hidInput);
      setHidInput('');
    }
  };

  useEffect(() => {
    if (mode !== 'camera') { scannerRef.current?.clear(); return; }
    let scanner: { render: (s: (c: string) => void, e: () => void) => void; clear: () => void } | null = null;
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      scanner = new Html5QrcodeScanner('qr-reader-masuk', { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 }, false);
      scanner.render((code: string) => processQRCode(code), () => {});
      scannerRef.current = scanner;
    });
    return () => { scannerRef.current?.clear(); };
  }, [mode, processQRCode]);

  const returnedCount = items.filter(i => i.status_masuk).length;
  const total = items.length;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
      <Loader2 size={32} style={{ animation: 'spin 0.6s linear infinite' }} />
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/scan" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Scan Barang Masuk</h1>
            <p className="page-subtitle" style={{ color: '#10b981', fontWeight: 600 }}>
              {sj?.nomor_sj} — {sj?.event_name}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700 }}>Progress Pengembalian</span>
          <span style={{ fontWeight: 700, color: returnedCount === total && total > 0 ? '#10b981' : '#94a3b8' }}>
            {returnedCount}/{total}
          </span>
        </div>
        <div className="progress-bar" style={{ height: '10px' }}>
          <div className="progress-fill" style={{ width: `${total ? (returnedCount / total) * 100 : 0}%` }} />
        </div>
        {returnedCount === total && total > 0 && (
          <div className="alert alert-success" style={{ marginTop: '0.75rem', padding: '0.625rem 0.875rem' }}>
            🎉 Semua barang sudah kembali! Surat jalan SELESAI.
          </div>
        )}
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button onClick={() => setMode('hid')} className={`btn btn-sm ${mode === 'hid' ? 'btn-primary' : 'btn-secondary'}`}>
          <Keyboard size={14} />Scanner Fisik
        </button>
        <button onClick={() => setMode('camera')} className={`btn btn-sm ${mode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}>
          <Camera size={14} />Kamera HP
        </button>
      </div>

      {mode === 'hid' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <label className="label" style={{ marginBottom: '0.5rem', display: 'block' }}>Scan / Ketik QR Code</label>
          <input
            ref={hidRef}
            className="input"
            style={{ fontSize: '1.125rem', letterSpacing: '0.05em', fontFamily: 'monospace', textAlign: 'center' }}
            placeholder="Arahkan scanner ke sini..."
            value={hidInput}
            onChange={e => setHidInput(e.target.value)}
            onKeyDown={handleHIDSubmit}
            autoComplete="off"
            autoFocus
          />
        </div>
      )}

      {mode === 'camera' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div id="qr-reader-masuk" style={{ width: '100%' }} />
        </div>
      )}

      {lastScan && (
        <div className={`alert ${lastScan.status === 'ok' ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: '1rem' }}>
          {lastScan.status === 'ok' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <div>
            <div style={{ fontWeight: 600 }}>{lastScan.msg}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, fontFamily: 'monospace' }}>{lastScan.code}</div>
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Status Pengembalian</h2>
        </div>
        {items.map(sji => (
          <div key={sji.id} style={{
            display: 'flex', alignItems: 'center', gap: '0.875rem',
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: sji.status_masuk ? 'rgba(16,185,129,0.06)' : 'transparent',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: sji.status_masuk ? 'rgba(16,185,129,0.2)' : 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sji.status_masuk
                ? <CheckCircle2 size={16} color="#10b981" />
                : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: sji.status_masuk ? '#f1f5f9' : '#94a3b8' }}>
                {sji.item?.name ?? '-'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{sji.item?.qr_code}</div>
            </div>
            <span className={`badge ${sji.status_masuk ? 'badge-success' : 'badge-warning'}`}>
              {sji.status_masuk ? '✓ Kembali' : '⏳ Belum'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

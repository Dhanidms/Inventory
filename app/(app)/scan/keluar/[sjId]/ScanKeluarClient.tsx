'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Camera, Keyboard, CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface SJItem {
  id: string;
  item_id: string;
  status_keluar: boolean;
  item: { id: string; name: string; category: string; qr_code: string } | null;
}

interface Props {
  sjId: string;
}

export default function ScanKeluarClient({ sjId }: Props) {
  const supabase = createClient();
  const [sj, setSJ] = useState<{ nomor_sj: string; event_name: string; pic_name: string } | null>(null);
  const [items, setItems] = useState<SJItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'hid' | 'camera'>('hid');
  const [hidInput, setHidInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const [lastScan, setLastScan] = useState<{ code: string; status: 'ok' | 'warn' | 'error'; msg: string } | null>(null);
  const hidRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<{ clear: () => void } | null>(null);

  const loadData = useCallback(async () => {
    const { data: sjData } = await supabase
      .from('surat_jalan')
      .select('nomor_sj, event_name, pic_name')
      .eq('id', sjId)
      .single();
    setSJ(sjData);

    const { data: itemsData } = await supabase
      .from('surat_jalan_items')
      .select('id, item_id, status_keluar, item:items(id, name, category, qr_code)')
      .eq('surat_jalan_id', sjId);

    setItems((itemsData ?? []) as unknown as SJItem[]);
    setLoading(false);
  }, [supabase, sjId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-focus HID input
  useEffect(() => {
    if (mode === 'hid') {
      hidRef.current?.focus();
    }
  }, [mode]);

  const processQRCode = useCallback(async (qrCode: string) => {
    if (processing) return;
    const code = qrCode.trim();
    if (!code) return;

    setProcessing(true);

    const { data: { user } } = await supabase.auth.getUser();

    // Find item in SJ list
    const sjItem = items.find(i => i.item?.qr_code === code);

    if (!sjItem) {
      // QR not in this SJ
      setLastScan({ code, status: 'warn', msg: '⚠️ Barang tidak ada dalam surat jalan ini!' });
      toast.warning('Barang tidak ditemukan dalam surat jalan ini!', { duration: 4000 });
      setProcessing(false);
      return;
    }

    if (sjItem.status_keluar) {
      setLastScan({ code, status: 'warn', msg: `⚠️ ${sjItem.item?.name} sudah discan sebelumnya` });
      toast.warning(`${sjItem.item?.name} sudah discan keluar`, { duration: 3000 });
      setProcessing(false);
      return;
    }

    // Mark as checked out
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('surat_jalan_items')
      .update({ status_keluar: true, waktu_keluar: now })
      .eq('id', sjItem.id);

    if (updateError) {
      setLastScan({ code, status: 'error', msg: `❌ Error: ${updateError.message}` });
      toast.error('Gagal update: ' + updateError.message);
      setProcessing(false);
      return;
    }

    // Update item status
    await supabase.from('items').update({ status: 'disewa' }).eq('id', sjItem.item_id);

    // Log scan
    await supabase.from('scan_logs').insert({
      item_id: sjItem.item_id,
      surat_jalan_id: sjId,
      action: 'keluar',
      scanned_by: user!.id,
    });

    setLastScan({ code, status: 'ok', msg: `✓ ${sjItem.item?.name} — KELUAR` });
    toast.success(`${sjItem.item?.name} berhasil discan keluar!`);

    // Reload items
    await loadData();

    // Check if all items scanned
    const updatedItems = items.map(i => i.id === sjItem.id ? { ...i, status_keluar: true } : i);
    const allDone = updatedItems.every(i => i.status_keluar);
    if (allDone) {
      await supabase.from('surat_jalan').update({ status: 'keluar' }).eq('id', sjId);
      toast.success('🎉 Semua barang sudah keluar! Status diubah ke "Barang Keluar"', { duration: 5000 });
    }

    setProcessing(false);
  }, [items, processing, sjId, supabase, loadData]);

  const handleHIDSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processQRCode(hidInput);
      setHidInput('');
    }
  };

  // Camera scanner
  useEffect(() => {
    if (mode !== 'camera') {
      scannerRef.current?.clear();
      return;
    }

    let html5QrcodeScanner: { render: (success: (code: string) => void, error: () => void) => void; clear: () => void } | null = null;

    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      );

      html5QrcodeScanner.render(
        (code: string) => {
          processQRCode(code);
        },
        () => {} // error handler (silent)
      );

      scannerRef.current = html5QrcodeScanner;
    });

    return () => { scannerRef.current?.clear(); };
  }, [mode, processQRCode]);

  const checkedCount = items.filter(i => i.status_keluar).length;
  const total = items.length;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 0.6s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/scan" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="page-title">Scan Barang Keluar</h1>
            <p className="page-subtitle" style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
              {sj?.nomor_sj} — {sj?.event_name}
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Progress Barang Keluar</span>
          <span style={{ color: checkedCount === total && total > 0 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace" }}>
            {checkedCount}/{total}
          </span>
        </div>
        <div className="progress-bar" style={{ height: '10px' }}>
          <div className="progress-fill" style={{ width: `${total ? (checkedCount / total) * 100 : 0}%` }} />
        </div>
        {checkedCount === total && total > 0 && (
          <div className="alert alert-success" style={{ marginTop: '0.75rem', padding: '0.625rem 0.875rem' }}>
            🎉 Semua barang sudah discan keluar!
          </div>
        )}
      </div>

      {/* Mode selector */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setMode('hid')}
          className={`btn btn-sm ${mode === 'hid' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Keyboard size={14} />
          Scanner Fisik / Manual
        </button>
        <button
          onClick={() => setMode('camera')}
          className={`btn btn-sm ${mode === 'camera' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Camera size={14} />
          Kamera HP
        </button>
      </div>

      {/* HID / Manual input */}
      {mode === 'hid' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <label className="label" style={{ marginBottom: '0.5rem', display: 'block' }}>
            Scan QR Code (tekan Enter setelah scan)
          </label>
          <input
            ref={hidRef}
            className="input"
            style={{ fontSize: '1.125rem', letterSpacing: '0.05em', fontFamily: 'monospace', textAlign: 'center' }}
            placeholder="Arahkan scanner ke sini atau ketik kode..."
            value={hidInput}
            onChange={e => setHidInput(e.target.value)}
            onKeyDown={handleHIDSubmit}
            autoComplete="off"
            autoFocus
          />
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            💡 Input field ini auto-fokus. Scan dengan scanner USB/Bluetooth langsung bekerja.
          </p>
        </div>
      )}

      {/* Camera scanner */}
      {mode === 'camera' && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div id="qr-reader" style={{ width: '100%' }} />
        </div>
      )}

      {/* Last scan result */}
      {lastScan && (
        <div className={`alert ${lastScan.status === 'ok' ? 'alert-success' : lastScan.status === 'warn' ? 'alert-warning' : 'alert-danger'}`}
          style={{ marginBottom: '1rem' }}>
          {lastScan.status === 'ok' ? <CheckCircle2 size={18} /> :
           lastScan.status === 'warn' ? <AlertTriangle size={18} /> :
           <XCircle size={18} />}
          <div>
            <div style={{ fontWeight: 600 }}>{lastScan.msg}</div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, marginTop: '0.2rem', fontFamily: 'monospace' }}>{lastScan.code}</div>
          </div>
        </div>
      )}

      {/* Items checklist */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Checklist Barang</h2>
        </div>
        {items.map(sji => (
          <div
            key={sji.id}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.875rem',
              padding: '0.75rem 1.25rem',
              borderBottom: '1px solid var(--border)',
              background: sji.status_keluar ? 'rgba(73,183,171,0.07)' : 'transparent',
              transition: 'background 0.2s',
            }}
          >
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              background: sji.status_keluar ? 'rgba(73,183,171,0.2)' : 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sji.status_keluar ? <CheckCircle2 size={16} color="var(--success)" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-light)' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: sji.status_keluar ? 600 : 400, fontSize: '0.875rem', color: sji.status_keluar ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {sji.item?.name ?? '-'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{sji.item?.qr_code}</div>
            </div>
            {sji.status_keluar && <span className="badge badge-success">✓ Keluar</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

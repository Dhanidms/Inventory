'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { parseExcelFile } from '@/lib/excel-parser';
import { generateQRCode } from '@/lib/qr-utils';
import { toast } from 'sonner';
import { Upload, ArrowLeft, FileSpreadsheet, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { ImportRow } from '@/types';

export default function ImportBarangPage() {
  const router = useRouter();
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (f: File) => {
    setFile(f);
    setLoading(true);
    setRows([]);
    setErrors([]);
    try {
      const result = await parseExcelFile(f);
      setRows(result.rows);
      setErrors(result.errors);
      if (result.rows.length > 0) {
        toast.success(`${result.rows.length} baris siap diimport`);
      }
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) processFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv'))) {
      processFile(f);
    } else {
      toast.error('Hanya mendukung file Excel (.xlsx, .xls) atau CSV');
    }
  }, []);

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);

    try {
      const insertData = rows.map(row => ({
        name: row.name,
        category: row.category,
        condition: row.condition ?? 'baik',
        notes: row.notes ?? null,
        qr_code: generateQRCode(),
        status: 'tersedia',
      }));

      const BATCH_SIZE = 50;
      let totalInserted = 0;

      for (let i = 0; i < insertData.length; i += BATCH_SIZE) {
        const batch = insertData.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('items').insert(batch);
        if (error) throw error;
        totalInserted += batch.length;
      }

      toast.success(`${totalInserted} barang berhasil diimport!`);
      router.push('/barang');
      router.refresh();
    } catch (err: unknown) {
      toast.error('Gagal import: ' + (err as Error).message);
    } finally {
      setImporting(false);
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
            <h1 className="page-title">Import Barang dari Excel/CSV</h1>
            <p className="page-subtitle">Upload file untuk menambah barang secara massal</p>
          </div>
        </div>
      </div>

      {/* Template info */}
      <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
        <FileSpreadsheet size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Format kolom yang dibutuhkan:</strong>
          <code style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
            nama | kategori | kondisi (opsional) | catatan (opsional)
          </code>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem' }}>
            Baris pertama harus header. Kondisi: baik / rusak / maintenance
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      {!file && (
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${isDragging ? '#6366f1' : '#334155'}`,
            borderRadius: '12px',
            padding: '3rem 2rem',
            textAlign: 'center',
            background: isDragging ? 'rgba(99,102,241,0.08)' : 'var(--bg-secondary)',
            transition: 'all 0.2s',
            marginBottom: '1rem',
          }}
        >
          <Upload size={40} style={{ color: '#64748b', marginBottom: '1rem' }} />
          <p style={{ color: '#94a3b8', marginBottom: '1rem', fontSize: '0.95rem' }}>
            Drag & drop file Excel/CSV ke sini, atau
          </p>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <FileSpreadsheet size={16} />
            Pilih File
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </label>
        </div>
      )}

      {/* File selected */}
      {file && (
        <div className="card" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileSpreadsheet size={20} color="#818cf8" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{file.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {(file.size / 1024).toFixed(0)} KB
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setFile(null); setRows([]); setErrors([]); }}
          >
            Ganti File
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          <Loader2 size={32} style={{ animation: 'spin 0.6s linear infinite', margin: '0 auto 0.75rem' }} />
          <p>Membaca file...</p>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: '1rem', flexDirection: 'column', alignItems: 'flex-start' }}>
          <strong>Beberapa baris dilewati ({errors.length} error):</strong>
          <ul style={{ margin: '0.5rem 0 0 1rem', padding: 0, fontSize: '0.8rem' }}>
            {errors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
            {errors.length > 5 && <li>...dan {errors.length - 5} error lainnya</li>}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      {rows.length > 0 && (
        <>
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
              Preview Data ({rows.length} barang)
            </h2>
          </div>

          <div className="table-wrapper" style={{ marginBottom: '1.25rem' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama Barang</th>
                  <th>Kategori</th>
                  <th>Kondisi</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, i) => (
                  <tr key={i}>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>{row.name}</td>
                    <td><span className="badge badge-muted">{row.category}</span></td>
                    <td>
                      <span className={`badge ${row.condition === 'baik' ? 'badge-success' : row.condition === 'rusak' ? 'badge-danger' : 'badge-warning'}`}>
                        {row.condition ?? 'baik'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{row.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <div style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid var(--border)' }}>
                Menampilkan 50 dari {rows.length} baris
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => { setFile(null); setRows([]); setErrors([]); }}
            >
              Batal
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? (
                <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Mengimport...</>
              ) : (
                <><CheckCircle2 size={16} /> Import {rows.length} Barang</>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

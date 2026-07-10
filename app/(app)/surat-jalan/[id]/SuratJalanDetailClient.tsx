'use client';

import { useState } from 'react';
import type { SuratJalan } from '@/types';
import { FileDown, QrCode, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '@/lib/date-utils';
import { toast } from 'sonner';

interface SJItem {
  id: string;
  status_keluar: boolean;
  waktu_keluar: string | null;
  status_masuk: boolean;
  waktu_masuk: string | null;
  item: {
    id: string;
    name: string;
    category: string;
    qr_code: string;
    condition: string;
    status: string;
  } | null;
}

interface Props {
  sj: SuratJalan & { surat_jalan_items?: SJItem[] };
  isAdmin: boolean;
}

export default function SuratJalanDetailClient({ sj, isAdmin }: Props) {
  const [showQRAll, setShowQRAll] = useState(false);

  const handleGeneratePDF = async () => {
    try {
      const { generateSuratJalanPDF } = await import('@/lib/pdf-generator');
      generateSuratJalanPDF(sj as Parameters<typeof generateSuratJalanPDF>[0]);
      toast.success('PDF berhasil digenerate!');
    } catch {
      toast.error('Gagal generate PDF');
    }
  };

  const handlePrintAllQR = () => {
    const items = sj.surat_jalan_items ?? [];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // We'll render QR codes after window opens
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>QR Codes - ${sj.nomor_sj}</title>
        <style>
          body { font-family: sans-serif; padding: 16px; background: white; }
          h1 { font-size: 14px; margin-bottom: 16px; }
          .grid { display: flex; flex-wrap: wrap; gap: 12px; }
          .label { border: 1.5px solid #000; border-radius: 6px; padding: 8px; text-align: center; width: 150px; }
          .label svg { width: 120px; height: 120px; }
          h3 { margin: 4px 0 0; font-size: 10px; font-weight: 700; word-break: break-all; }
          p { margin: 2px 0 0; font-size: 8px; color: #555; font-family: monospace; }
          @media print { body { margin: 0; padding: 8px; } }
        </style>
      </head>
      <body>
        <h1>QR Labels — ${sj.nomor_sj} — ${sj.event_name}</h1>
        <div class="grid" id="qr-grid"></div>
        <script>
          window.items = ${JSON.stringify(items.map(i => ({ name: i.item?.name, qr_code: i.item?.qr_code, category: i.item?.category })))};
        </script>
      </body>
      </html>
    `);

    // QR SVG generation would need client-side rendering
    // For now print with text labels
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const items = sj.surat_jalan_items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={handleGeneratePDF} className="btn btn-secondary btn-sm">
          <FileDown size={14} />
          Download PDF
        </button>
        <button onClick={() => setShowQRAll(!showQRAll)} className="btn btn-secondary btn-sm">
          <QrCode size={14} />
          {showQRAll ? 'Sembunyikan QR' : 'Tampilkan Semua QR'}
        </button>
        {showQRAll && (
          <button onClick={handlePrintAllQR} className="btn btn-secondary btn-sm">
            <Printer size={14} />
            Print Semua Label
          </button>
        )}
      </div>

      {/* QR grid view */}
      {showQRAll && (
        <div className="card">
          <h3 style={{ margin: '0 0 1rem', fontSize: '0.875rem', fontWeight: 700 }}>QR Code Semua Barang</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {items.map(sji => sji.item && (
              <div key={sji.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                padding: '0.875rem', background: 'var(--bg-tertiary)', borderRadius: '10px',
                width: '140px', textAlign: 'center',
              }}>
                <div style={{ background: 'white', padding: '0.5rem', borderRadius: '6px' }}>
                  <QRCodeSVG value={sji.item.qr_code} size={100} level="M" />
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, wordBreak: 'break-word' }}>{sji.item.name}</div>
                <div style={{ fontSize: '0.65rem', color: '#64748b', wordBreak: 'break-all' }}>{sji.item.qr_code}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
            Daftar Barang <span style={{ color: '#818cf8' }}>({items.length})</span>
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <p>Tidak ada barang dalam surat jalan ini</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ borderRadius: 0, border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nama Barang</th>
                  <th>Kategori</th>
                  <th>QR Code</th>
                  <th style={{ textAlign: 'center' }}>Keluar</th>
                  <th style={{ textAlign: 'center' }}>Kembali</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sji, idx) => (
                  <tr key={sji.id}>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{sji.item?.name ?? '-'}</div>
                    </td>
                    <td>
                      <span className="badge badge-muted">{sji.item?.category ?? '-'}</span>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.72rem', color: '#818cf8', background: 'var(--accent-light)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {sji.item?.qr_code ?? '-'}
                      </code>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {sji.status_keluar ? (
                        <span className="badge badge-warning">✓ Keluar</span>
                      ) : (
                        <span className="badge badge-muted">—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {sji.status_masuk ? (
                        <span className="badge badge-success">✓ Kembali</span>
                      ) : (
                        <span className="badge badge-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

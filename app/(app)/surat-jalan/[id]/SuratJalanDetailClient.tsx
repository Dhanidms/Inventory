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

  const [printType, setPrintType] = useState<'qr' | 'barcode'>('qr');

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

    const scriptHtml = printType === 'qr' ? `
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
      <script>
        window.onload = () => {
          const items = ${JSON.stringify(items.map(i => i.item))};
          const grid = document.getElementById('grid');
          items.forEach((item, index) => {
            if (!item) return;
            const div = document.createElement('div');
            div.className = 'label qr';
            const canvasContainer = document.createElement('div');
            canvasContainer.className = 'canvas-container';
            const canvas = document.createElement('canvas');
            canvasContainer.appendChild(canvas);
            
            const title = document.createElement('h3');
            title.innerText = item.name;
            const pCode = document.createElement('p');
            pCode.innerText = item.qr_code;
            
            div.appendChild(canvasContainer);
            div.appendChild(title);
            div.appendChild(pCode);
            grid.appendChild(div);
            
            QRCode.toCanvas(canvas, item.qr_code, { width: 150, margin: 1 });
          });
          setTimeout(() => window.print(), 1000);
        };
      </script>
    ` : `
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
      <script>
        window.onload = () => {
          const items = ${JSON.stringify(items.map(i => i.item))};
          const grid = document.getElementById('grid');
          items.forEach((item, index) => {
            if (!item) return;
            const div = document.createElement('div');
            div.className = 'label barcode';
            
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'barcode-' + index;
            
            const info = document.createElement('div');
            info.className = 'info';
            const title = document.createElement('h3');
            title.innerText = item.name;
            const pCode = document.createElement('p');
            pCode.innerText = item.category;
            
            info.appendChild(title);
            info.appendChild(pCode);
            
            div.appendChild(svg);
            div.appendChild(info);
            grid.appendChild(div);
            
            JsBarcode("#barcode-" + index, item.qr_code, {
              format: "CODE128", width: 1, height: 40, displayValue: true, fontSize: 10, margin: 0
            });
          });
          setTimeout(() => window.print(), 1000);
        };
      </script>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Labels - ${sj.nomor_sj}</title>
        <style>
          body { font-family: sans-serif; padding: 16px; background: white; margin: 0; }
          .header { font-size: 14px; margin-bottom: 16px; text-align: center; font-weight: bold; }
          .grid { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
          
          .label { border: 1px solid #000; padding: 6px; text-align: center; }
          .label.qr { width: 120px; border-radius: 4px; }
          .label.barcode { width: 260px; border-radius: 4px; display: flex; align-items: center; gap: 8px; padding: 6px 8px; }
          .label.barcode .info { text-align: left; flex: 1; }
          
          h3 { margin: 0 0 2px; font-size: 10px; font-weight: 700; word-break: break-word; }
          p { margin: 2px 0 0; font-size: 8px; color: #333; font-family: monospace; }
          .canvas-container { display: flex; justify-content: center; margin-bottom: 4px; }
          .canvas-container canvas { width: 90px !important; height: 90px !important; }
          
          @media print { 
            body { padding: 0; }
            .header { display: none; }
            .grid { gap: 4px; justify-content: flex-start; }
            .label { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">Cetak Label — ${sj.nomor_sj} — ${sj.event_name}</div>
        <div class="grid" id="grid"></div>
        ${scriptHtml}
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  const items = sj.surat_jalan_items ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={handleGeneratePDF} className="btn btn-secondary btn-sm">
          <FileDown size={14} />
          Download PDF
        </button>
        <button onClick={() => setShowQRAll(!showQRAll)} className="btn btn-secondary btn-sm">
          <QrCode size={14} />
          {showQRAll ? 'Sembunyikan Label' : 'Tampilkan Label Barang'}
        </button>
        {showQRAll && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.2rem', borderRadius: 'var(--radius-sm)' }}>
            <select 
              value={printType} 
              onChange={e => setPrintType(e.target.value as 'qr' | 'barcode')}
              className="select"
              style={{ minHeight: '32px', height: '32px', fontSize: '0.8rem', width: 'auto', padding: '0 2.5rem 0 0.75rem' }}
            >
              <option value="qr">QR Code</option>
              <option value="barcode">Barcode</option>
            </select>
            <button onClick={handlePrintAllQR} className="btn btn-secondary btn-sm" style={{ height: '32px' }}>
              <Printer size={14} />
              Print Semua
            </button>
          </div>
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
                padding: '0.875rem', background: 'var(--bg-tertiary)', borderRadius: '3px',
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
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: "'Oswald', sans-serif", letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Daftar Barang <span style={{ color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace" }}>({items.length})</span>
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
                  <th className="hide-mobile">Kategori</th>
                  <th className="hide-mobile">QR Code</th>
                  <th style={{ textAlign: 'center' }}>Keluar</th>
                  <th style={{ textAlign: 'center' }}>Kembali</th>
                </tr>
              </thead>
              <tbody>
                {items.map((sji, idx) => (
                  <tr key={sji.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: "'IBM Plex Mono', monospace" }}>{idx + 1}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{sji.item?.name ?? '-'}</div>
                    </td>
                    <td className="hide-mobile">
                      <span className="badge badge-muted">{sji.item?.category ?? '-'}</span>
                    </td>
                    <td className="hide-mobile">
                      <code style={{ fontSize: '0.72rem', color: 'var(--accent)', background: 'var(--accent-light)', padding: '0.2rem 0.4rem', borderRadius: '3px', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.02em' }}>
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

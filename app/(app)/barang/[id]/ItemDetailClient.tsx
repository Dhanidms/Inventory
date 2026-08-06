'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Item } from '@/types';
import { Printer, Download, Settings2 } from 'lucide-react';

export default function ItemDetailClient({ item }: { item: Item }) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [printType, setPrintType] = useState<'qr' | 'barcode'>('qr');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let contentHtml = '';
    let scriptHtml = '';

    if (printType === 'qr') {
      const svgContent = qrRef.current?.querySelector('svg')?.outerHTML ?? '';
      contentHtml = `
        <div class="label qr">
          ${svgContent}
          <h3>${item.name}</h3>
          <p>${item.qr_code}</p>
          <p>${item.category}</p>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="label barcode">
          <svg id="barcode"></svg>
          <div class="info">
            <h3>${item.name}</h3>
            <p>${item.category}</p>
          </div>
        </div>
      `;
      scriptHtml = `
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <script>
          window.onload = () => {
            JsBarcode("#barcode", "${item.qr_code}", {
              format: "CODE128",
              width: 1,
              height: 40,
              displayValue: true,
              fontSize: 10,
              margin: 0
            });
            setTimeout(() => window.print(), 500);
          };
        </script>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label - ${item.name}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; }
            .label { border: 1px solid #000; padding: 6px; text-align: center; }
            .label.qr { width: 120px; border-radius: 4px; }
            .label.barcode { width: 260px; border-radius: 4px; display: flex; align-items: center; gap: 8px; padding: 6px 8px; }
            .label.barcode .info { text-align: left; }
            h3 { margin: 0 0 2px; font-size: 10px; font-weight: 700; word-break: break-word; }
            p { margin: 2px 0 0; font-size: 8px; color: #333; font-family: monospace; }
            .qr svg { width: 90px; height: 90px; }
            @media print { body { margin: 0; align-items: flex-start; justify-content: flex-start; } }
          </style>
        </head>
        <body>
          ${contentHtml}
          ${printType === 'qr' ? '<script>setTimeout(() => window.print(), 200);</script>' : scriptHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>Identitas Barang</h3>

      <div
        ref={qrRef}
        style={{
          display: 'inline-flex',
          padding: '1rem',
          background: 'white',
          borderRadius: '10px',
          marginBottom: '0.75rem',
        }}
      >
        <QRCodeSVG
          value={item.qr_code}
          size={160}
          level="M"
          includeMargin={false}
        />
      </div>

      <code style={{
        display: 'block',
        fontSize: '0.75rem',
        color: '#818cf8',
        background: 'var(--accent-light)',
        padding: '0.4rem 0.75rem',
        borderRadius: '6px',
        marginBottom: '1rem',
        wordBreak: 'break-all',
      }}>
        {item.qr_code}
      </code>

      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>
        Tempel stiker QR atau Barcode ini pada fisik barang untuk memudahkan proses scan
      </p>

      {/* Label Type Selector */}
      <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontWeight: 600 }}>Format Cetak</label>
        <select 
          value={printType} 
          onChange={e => setPrintType(e.target.value as 'qr' | 'barcode')}
          className="input"
          style={{ width: '100%', fontSize: '0.875rem' }}
        >
          <option value="qr">QR Code</option>
          <option value="barcode">Barcode</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handlePrint} className="btn btn-secondary btn-full" style={{ flex: 1, justifyContent: 'center' }}>
          <Printer size={16} />
          Print Label {printType === 'qr' ? 'QR' : 'Barcode'}
        </button>
      </div>
    </div>
  );
}

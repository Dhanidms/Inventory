'use client';

import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Item } from '@/types';
import { Printer, Download } from 'lucide-react';

export default function ItemDetailClient({ item }: { item: Item }) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !qrRef.current) return;

    const svgContent = qrRef.current.querySelector('svg')?.outerHTML ?? '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${item.name}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: white; }
            .label { width: 200px; border: 2px solid #000; border-radius: 8px; padding: 12px; text-align: center; }
            h3 { margin: 0 0 4px; font-size: 12px; font-weight: 700; word-break: break-all; }
            p { margin: 4px 0 0; font-size: 9px; color: #666; font-family: monospace; }
            svg { width: 150px; height: 150px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="label">
            ${svgContent}
            <h3>${item.name}</h3>
            <p>${item.qr_code}</p>
            <p>${item.category}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem' }}>QR Code</h3>

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

      <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', lineHeight: '1.5' }}>
        Tempel stiker QR ini pada fisik barang untuk memudahkan proses scan
      </p>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button onClick={handlePrint} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
          <Printer size={14} />
          Print Label
        </button>
      </div>
    </div>
  );
}

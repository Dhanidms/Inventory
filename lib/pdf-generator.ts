import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SuratJalan } from '@/types';
import { formatDate, formatDateTime } from './date-utils';

export function generateSuratJalanPDF(sj: SuratJalan): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ─── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SURAT JALAN', margin, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Rental Equipment Broadcast / LED / AV', margin, 19);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(sj.nomor_sj, pageWidth - margin, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Dibuat: ${formatDateTime(sj.created_at)}`, pageWidth - margin, 19, { align: 'right' });

  // ─── Info Box ─────────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, 33, pageWidth - margin * 2, 48, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  const col1x = margin + 4;
  const col2x = pageWidth / 2 + 4;
  let y = 40;

  const infoLeft = [
    ['Nama Event', sj.event_name],
    ['PIC', sj.pic_name],
    ['No. HP PIC', sj.pic_phone],
  ];

  const infoRight = [
    ['Tgl Ambil', formatDate(sj.tanggal_ambil)],
    ['Rencana Kembali', formatDate(sj.tanggal_rencana_kembali)],
    ['Tgl Aktual Kembali', formatDate(sj.tanggal_aktual_kembali)],
  ];

  infoLeft.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, col1x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', col1x + 32, y);
    y += 8;
  });

  y = 40;
  infoRight.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, col2x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', col2x + 36, y);
    y += 8;
  });

  if (sj.notes) {
    y = 66;
    doc.setFont('helvetica', 'bold');
    doc.text('Catatan:', col1x, y);
    doc.setFont('helvetica', 'normal');
    doc.text(sj.notes, col1x + 20, y, { maxWidth: pageWidth - margin * 2 - 24 });
  }

  // ─── Tabel Barang ─────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Daftar Barang', margin, 90);

  const items = sj.surat_jalan_items || [];

  autoTable(doc, {
    startY: 94,
    margin: { left: margin, right: margin },
    head: [['No', 'Nama Barang', 'Kategori', 'QR Code', 'Status Keluar', 'Status Masuk']],
    body: items.map((sji, idx) => [
      idx + 1,
      sji.item?.name || '-',
      sji.item?.category || '-',
      sji.item?.qr_code || '-',
      sji.status_keluar ? `✓ ${formatDateTime(sji.waktu_keluar)}` : '—',
      sji.status_masuk ? `✓ ${formatDateTime(sji.waktu_masuk)}` : '—',
    ]),
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 32 },
      4: { cellWidth: 35 },
      5: { cellWidth: 35 },
    },
  });

  // ─── Tanda Tangan ─────────────────────────────────────────────────────────
  const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  const signY = finalY;

  if (signY < 230) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    const centerPage = pageWidth / 2;
    const leftSign = margin + 20;
    const rightSign = centerPage + 20;

    doc.text('Penanggung Jawab', leftSign, signY, { align: 'center' });
    doc.text('Penerima', rightSign + 20, signY, { align: 'center' });

    doc.line(leftSign - 20, signY + 25, leftSign + 20, signY + 25);
    doc.line(rightSign, signY + 25, rightSign + 40, signY + 25);

    doc.text(sj.pic_name, leftSign, signY + 30, { align: 'center' });
    doc.text('(........................)', rightSign + 20, signY + 30, { align: 'center' });
  }

  // ─── Footer ───────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 8;
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Dokumen ini digenerate otomatis — ${formatDateTime(new Date().toISOString())}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  doc.save(`${sj.nomor_sj.replace(/\//g, '-')}.pdf`);
}

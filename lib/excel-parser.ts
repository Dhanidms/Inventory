import * as XLSX from 'xlsx';
import type { ImportRow, ItemCondition } from '@/types';

export interface ParseResult {
  rows: ImportRow[];
  headers: string[];
  errors: string[];
}

export function parseExcelFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          resolve({ rows: [], headers: [], errors: ['File kosong atau tidak ada data'] });
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => String(h).trim());
        const errors: string[] = [];
        const rows: ImportRow[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const rowArr = jsonData[i] as unknown[];
          if (rowArr.every(cell => !cell)) continue; // skip empty rows

          const row: Record<string, unknown> = {};
          headers.forEach((header, idx) => {
            row[header] = rowArr[idx] ?? '';
          });

          // Map common column name variations
          const name = String(
            row['name'] || row['Nama'] || row['nama'] || row['NAMA'] || ''
          ).trim();
          const category = String(
            row['category'] || row['Kategori'] || row['kategori'] || row['KATEGORI'] || ''
          ).trim();

          if (!name) {
            errors.push(`Baris ${i + 1}: Kolom nama kosong`);
            continue;
          }
          if (!category) {
            errors.push(`Baris ${i + 1}: Kolom kategori kosong`);
            continue;
          }

          const conditionRaw = String(
            row['condition'] || row['Kondisi'] || row['kondisi'] || 'baik'
          ).toLowerCase().trim();
          const condition: ItemCondition = ['baik', 'rusak', 'maintenance'].includes(conditionRaw)
            ? (conditionRaw as ItemCondition)
            : 'baik';

          rows.push({
            name,
            category,
            condition,
            notes: String(row['notes'] || row['Catatan'] || row['catatan'] || '').trim(),
          });
        }

        resolve({ rows, headers, errors });
      } catch (err) {
        reject(new Error(`Gagal membaca file: ${err}`));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsArrayBuffer(file);
  });
}

export function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];

        if (jsonData.length < 2) {
          resolve({ rows: [], headers: [], errors: ['File kosong'] });
          return;
        }

        const headers = (jsonData[0] as string[]).map(h => String(h).trim());
        resolve({ rows: [], headers, errors: [] });
      } catch (err) {
        reject(new Error(`Gagal membaca CSV: ${err}`));
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsText(file);
  });
}

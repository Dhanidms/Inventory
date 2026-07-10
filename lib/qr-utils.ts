import { nanoid } from 'nanoid';

/**
 * Generate QR code unique string untuk barang
 * Format: INV-XXXXXXXXXXXX (12 karakter random)
 */
export function generateQRCode(): string {
  return `INV-${nanoid(12).toUpperCase()}`;
}

/**
 * Validasi format QR code barang
 */
export function isValidQRCode(code: string): boolean {
  return /^INV-[A-Z0-9]{12}$/.test(code);
}

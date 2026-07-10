import { format, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';

export function formatDate(dateStr: string | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!dateStr) return '-';
  try {
    return format(parseISO(dateStr), fmt, { locale: id });
  } catch {
    return '-';
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  return formatDate(dateStr, 'dd MMM yyyy, HH:mm');
}

export function isOverdue(tanggalRencanaKembali: string, status: string): boolean {
  if (status === 'selesai') return false;
  return isAfter(new Date(), parseISO(tanggalRencanaKembali));
}

export function getDaysOverdue(tanggalRencanaKembali: string): number {
  const days = differenceInDays(new Date(), parseISO(tanggalRencanaKembali));
  return Math.max(0, days);
}

export function getDaysRemaining(tanggalRencanaKembali: string): number {
  const days = differenceInDays(parseISO(tanggalRencanaKembali), new Date());
  return days;
}

export function formatPhone(phone: string): string {
  // Normalize: 08xxx -> 628xxx
  return phone.replace(/^0/, '62').replace(/[^0-9]/g, '');
}

export function getWhatsAppLink(phone: string, message?: string): string {
  const normalized = formatPhone(phone);
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${normalized}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

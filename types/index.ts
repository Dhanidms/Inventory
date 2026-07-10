export type Role = 'admin' | 'pic';
export type ItemCondition = 'baik' | 'rusak' | 'maintenance';
export type ItemStatus = 'tersedia' | 'disewa' | 'maintenance';
export type SJStatus = 'draft' | 'keluar' | 'sebagian_kembali' | 'selesai' | 'overdue';
export type ScanAction = 'keluar' | 'masuk';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  auth_provider: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  qr_code: string;
  condition: ItemCondition;
  status: ItemStatus;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuratJalan {
  id: string;
  nomor_sj: string;
  pic_user_id: string | null;
  pic_name: string;
  pic_phone: string;
  event_name: string;
  tanggal_ambil: string;
  tanggal_rencana_kembali: string;
  tanggal_aktual_kembali: string | null;
  status: SJStatus;
  created_by: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  pic_user?: User;
  creator?: User;
  surat_jalan_items?: SuratJalanItem[];
}

export interface SuratJalanItem {
  id: string;
  surat_jalan_id: string;
  item_id: string;
  status_keluar: boolean;
  waktu_keluar: string | null;
  status_masuk: boolean;
  waktu_masuk: string | null;
  // Relations
  item?: Item;
  surat_jalan?: SuratJalan;
}

export interface ScanLog {
  id: string;
  item_id: string;
  surat_jalan_id: string | null;
  action: ScanAction;
  scanned_by: string;
  scanned_at: string;
  notes: string | null;
  // Relations
  item?: Item;
  surat_jalan?: SuratJalan;
  scanner?: User;
}

export interface DashboardStats {
  totalItems: number;
  availableItems: number;
  rentedItems: number;
  maintenanceItems: number;
  activeSJ: number;
  overdueSJ: number;
}

export interface ImportRow {
  name: string;
  category: string;
  condition?: ItemCondition;
  notes?: string;
  [key: string]: unknown;
}

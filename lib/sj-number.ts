import { createClient } from '@/lib/supabase/server';

/**
 * Generate nomor surat jalan otomatis
 * Format: SJ/YYYY/NNN (reset per tahun)
 */
export async function generateNomorSJ(): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();
  const prefix = `SJ/${year}/`;

  // Ambil nomor SJ terakhir di tahun ini
  const { data } = await supabase
    .from('surat_jalan')
    .select('nomor_sj')
    .ilike('nomor_sj', `${prefix}%`)
    .order('nomor_sj', { ascending: false })
    .limit(1);

  if (!data || data.length === 0) {
    return `${prefix}001`;
  }

  const lastNomor = data[0].nomor_sj;
  const lastNum = parseInt(lastNomor.replace(prefix, ''), 10);
  const nextNum = (lastNum + 1).toString().padStart(3, '0');

  return `${prefix}${nextNum}`;
}

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ScanMasukClient from './ScanMasukClient';

export default async function ScanMasukPage({ params }: { params: Promise<{ sjId: string }> }) {
  const { sjId } = await params;
  const supabase = await createClient();
  const { data: sj } = await supabase
    .from('surat_jalan')
    .select('id, status')
    .eq('id', sjId)
    .single();

  if (!sj || !['keluar', 'sebagian_kembali'].includes(sj.status)) notFound();
  return <ScanMasukClient sjId={sjId} />;
}

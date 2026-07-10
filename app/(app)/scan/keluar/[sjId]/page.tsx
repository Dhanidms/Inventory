import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ScanKeluarClient from './ScanKeluarClient';

export default async function ScanKeluarPage({ params }: { params: Promise<{ sjId: string }> }) {
  const { sjId } = await params;
  const supabase = await createClient();
  const { data: sj } = await supabase.from('surat_jalan').select('id, status').eq('id', sjId).single();
  if (!sj || sj.status !== 'draft') notFound();

  return <ScanKeluarClient sjId={sjId} />;
}

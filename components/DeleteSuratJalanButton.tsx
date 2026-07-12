'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function DeleteSuratJalanButton({ sjId, sjName }: { sjId: string; sjName: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleDelete = async () => {
    if (!confirm(`Hapus surat jalan "${sjName}"? Semua data peminjaman di dalamnya akan ikut terhapus. Aksi ini tidak bisa dibatalkan.`)) return;

    setIsDeleting(true);
    
    try {
      // Hapus data scan_logs terkait dulu untuk menghindari foreign key constraint
      await supabase.from('scan_logs').delete().eq('surat_jalan_id', sjId);

      // Hapus surat_jalan_items
      const { error: itemsError } = await supabase.from('surat_jalan_items').delete().eq('surat_jalan_id', sjId);
      if (itemsError) throw itemsError;

      // Terakhir hapus surat_jalan
      const { error } = await supabase.from('surat_jalan').delete().eq('id', sjId);
      if (error) throw error;

      toast.success('Surat jalan berhasil dihapus');
      router.push('/surat-jalan');
      router.refresh();
    } catch (error: any) {
      toast.error('Gagal menghapus: ' + error.message);
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="btn btn-ghost"
      style={{ color: '#ef4444', gap: '0.5rem' }}
      title="Hapus Surat Jalan"
    >
      <Trash2 size={16} />
      {isDeleting ? 'Menghapus...' : 'Hapus SJ'}
    </button>
  );
}

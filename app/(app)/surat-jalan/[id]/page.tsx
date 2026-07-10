import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDate, getWhatsAppLink, isOverdue, getDaysOverdue } from '@/lib/date-utils';
import SuratJalanDetailClient from './SuratJalanDetailClient';

export const metadata: Metadata = { title: 'Detail Surat Jalan' };

export default async function SuratJalanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: userData } = await supabase.from('users').select('role').eq('id', user!.id).single();
  const isAdmin = userData?.role === 'admin';

  const { data: sj } = await supabase
    .from('surat_jalan')
    .select(`
      *,
      surat_jalan_items(
        id, status_keluar, waktu_keluar, status_masuk, waktu_masuk,
        item:items(id, name, category, qr_code, condition, status, photo_url)
      )
    `)
    .eq('id', id)
    .single();

  if (!sj) notFound();

  const total = sj.surat_jalan_items?.length ?? 0;
  const returned = sj.surat_jalan_items?.filter((i: { status_masuk: boolean }) => i.status_masuk).length ?? 0;
  const checkedOut = sj.surat_jalan_items?.filter((i: { status_keluar: boolean }) => i.status_keluar).length ?? 0;
  const overdue = isOverdue(sj.tanggal_rencana_kembali, sj.status);
  const daysOver = overdue ? getDaysOverdue(sj.tanggal_rencana_kembali) : 0;

  const STATUS_LABEL: Record<string, string> = {
    draft: 'Draft', keluar: 'Barang Keluar',
    sebagian_kembali: 'Sebagian Kembali', selesai: 'Selesai', overdue: 'Overdue',
  };
  const STATUS_BADGE: Record<string, string> = {
    draft: 'badge-muted', keluar: 'badge-warning',
    sebagian_kembali: 'badge-info', selesai: 'badge-success', overdue: 'badge-danger',
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/surat-jalan" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 className="page-title" style={{ fontSize: '1.125rem' }}>{sj.event_name}</h1>
              <span className={`badge ${overdue ? 'badge-danger' : STATUS_BADGE[sj.status] ?? 'badge-muted'}`}>
                {overdue ? `${daysOver}h overdue` : STATUS_LABEL[sj.status]}
              </span>
            </div>
            <p className="page-subtitle" style={{ color: '#818cf8', fontWeight: 600 }}>{sj.nomor_sj}</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem', alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Overdue alert */}
          {overdue && (
            <div className="alert alert-danger">
              <span>⚠️</span>
              <div>
                <strong>Overdue {daysOver} hari!</strong>
                <div style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>
                  Rencana kembali: {formatDate(sj.tanggal_rencana_kembali)}.
                  Segera hubungi PIC.
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {sj.status !== 'draft' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 600 }}>Progress Pengembalian</span>
                <span style={{ color: '#94a3b8' }}>{returned}/{total} barang</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${total ? (returned / total) * 100 : 0}%` }} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                <span>✓ {checkedOut} keluar</span>
                <span>↩ {returned} kembali</span>
                <span>⏳ {total - returned} belum kembali</span>
              </div>
            </div>
          )}

          {/* Barang list */}
          <SuratJalanDetailClient sj={sj} isAdmin={isAdmin} />
        </div>

        {/* Right — info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '80px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Informasi Surat Jalan</h2>

            {[
              { label: 'Nomor SJ', value: sj.nomor_sj },
              { label: 'Nama Event', value: sj.event_name },
              { label: 'Tgl Ambil', value: formatDate(sj.tanggal_ambil) },
              { label: 'Rencana Kembali', value: formatDate(sj.tanggal_rencana_kembali) },
              { label: 'Aktual Kembali', value: formatDate(sj.tanggal_aktual_kembali) },
            ].map(row => (
              <div key={row.label}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '0.15rem' }}>{row.label}</div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{row.value || '-'}</div>
              </div>
            ))}
          </div>

          {/* PIC Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Penanggung Jawab</h2>
            <div style={{ fontSize: '1rem', fontWeight: 700 }}>{sj.pic_name}</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href={`tel:${sj.pic_phone}`}
                className="btn btn-secondary btn-sm"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                <Phone size={14} />
                Telepon
              </a>
              <a
                href={getWhatsAppLink(sj.pic_phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-sm"
                style={{ flex: 1, textDecoration: 'none' }}
              >
                <MessageCircle size={14} />
                WhatsApp
              </a>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{sj.pic_phone}</div>
          </div>

          {/* Scan actions (admin only) */}
          {isAdmin && sj.status !== 'selesai' && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Aksi Scan</h2>
              {sj.status === 'draft' && (
                <Link href={`/scan/keluar/${sj.id}`} className="btn btn-primary btn-full" style={{ textDecoration: 'none' }}>
                  📦 Scan Barang Keluar
                </Link>
              )}
              {(sj.status === 'keluar' || sj.status === 'sebagian_kembali') && (
                <Link href={`/scan/masuk/${sj.id}`} className="btn btn-success btn-full" style={{ textDecoration: 'none' }}>
                  📥 Scan Barang Masuk
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';
import {
  LayoutDashboard, Package, FileText, QrCode, Users, LogOut,
  Menu, X, ChevronRight, Scan,
} from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
  user: User | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'pic'] },
  { href: '/barang', label: 'Barang', icon: Package, roles: ['admin'] },
  { href: '/surat-jalan', label: 'Surat Jalan', icon: FileText, roles: ['admin', 'pic'] },
  { href: '/scan', label: 'Scan QR', icon: Scan, roles: ['admin'] },
  { href: '/users', label: 'Pengguna', icon: Users, roles: ['admin'] },
];

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = user?.role ?? 'pic';
  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(role));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Berhasil logout');
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const NavLink = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.625rem 0.875rem',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: active ? 600 : 400,
          fontSize: '0.875rem',
          color: active ? '#818cf8' : '#94a3b8',
          background: active ? 'rgba(99,102,241,0.12)' : 'transparent',
          transition: 'all 0.15s',
          border: active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent',
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLElement).style.color = '#f1f5f9';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#94a3b8';
          }
        }}
      >
        <Icon size={18} />
        <span>{item.label}</span>
        {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
      </Link>
    );
  };

  return (
    <>
      {/* ─── Mobile Top Bar ──────────────────────────────────── */}
      <div className="glass" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn btn-ghost btn-icon"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <QrCode size={14} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' }}>
              InvRental
            </span>
          </div>
        </div>

        {/* User avatar */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: 'white',
              overflow: 'hidden',
            }}>
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                (user.name || user.email || '?')[0].toUpperCase()
              )}
            </div>
            <span style={{
              background: role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)',
              color: role === 'admin' ? '#818cf8' : '#34d399',
              padding: '0.1rem 0.5rem',
              borderRadius: '999px',
              fontWeight: 600,
              textTransform: 'uppercase',
              fontSize: '0.65rem',
              letterSpacing: '0.05em',
            } as React.CSSProperties}>
              {role}
            </span>
          </div>
        )}
      </div>

      {/* ─── Mobile Overlay ──────────────────────────────────── */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── Sidebar (Mobile Drawer + Desktop) ───────────────── */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: mobileOpen ? 0 : '-280px',
        width: '260px',
        height: '100dvh',
        zIndex: 45,
        background: '#0f172a',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: mobileOpen ? '8px 0 32px rgba(0,0,0,0.5)' : 'none',
        padding: '1.25rem 0.875rem',
        paddingTop: '80px',
        overflowY: 'auto',
      }}>
        {/* Nav items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {filteredNav.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* User info + Logout */}
        <div style={{
          borderTop: '1px solid #1e293b',
          paddingTop: '1rem',
          marginTop: '1rem',
        }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem', borderRadius: '8px',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: 'white', fontSize: '0.875rem',
                overflow: 'hidden',
              }}>
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} alt={user.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (user.name || user.email || '?')[0].toUpperCase()
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f1f5f9', truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as React.CSSProperties}>
                  {user.name || 'User'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-full"
            style={{ justifyContent: 'flex-start', gap: '0.75rem', color: '#ef4444' }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ─── Bottom Nav (Mobile) ──────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(15,23,42,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        padding: '0.5rem 0 env(safe-area-inset-bottom)',
      }}>
        {filteredNav.slice(0, 5).map(item => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.2rem',
                padding: '0.375rem 0',
                textDecoration: 'none',
                color: active ? '#818cf8' : '#64748b',
                fontSize: '0.65rem',
                fontWeight: active ? 600 : 400,
                transition: 'color 0.15s',
              }}
            >
              <div style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '8px',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <Icon size={20} />
              </div>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

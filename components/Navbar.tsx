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
          borderRadius: '3px',
          textDecoration: 'none',
          fontWeight: active ? 600 : 400,
          fontSize: '0.875rem',
          color: active ? '#f2a638' : '#9aa19f',
          background: active ? 'rgba(242,166,56,0.1)' : 'transparent',
          transition: 'all 0.15s',
          border: active ? '1px solid rgba(242,166,56,0.22)' : '1px solid transparent',
          fontFamily: active ? "'Oswald', sans-serif" : "'Inter', sans-serif",
          letterSpacing: active ? '0.04em' : '0',
          textTransform: active ? 'uppercase' : 'none',
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLElement).style.color = '#ece8e0';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#9aa19f';
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
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn btn-ghost btn-icon"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            {/* Road-case style logo mark — amber on dark */}
            <div style={{
              width: '30px', height: '30px', borderRadius: '3px',
              background: '#f2a638',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(242,166,56,0.4)',
            }}>
              <QrCode size={15} color="#191b1c" strokeWidth={2.5} />
            </div>
            <span style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#ece8e0',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              InvRental
            </span>
          </div>
        </div>

        {/* User avatar */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '3px',
              background: '#f2a638',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: '#191b1c',
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
              background: role === 'admin' ? 'rgba(242,166,56,0.15)' : 'rgba(73,183,171,0.15)',
              color: role === 'admin' ? '#f2a638' : '#49b7ab',
              padding: '0.1rem 0.5rem',
              borderRadius: '2px',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '0.62rem',
              letterSpacing: '0.08em',
              fontFamily: "'IBM Plex Mono', monospace",
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
            background: 'rgba(0,0,0,0.65)',
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
        background: '#191b1c',
        borderRight: '1px solid #383b3c',
        display: 'flex',
        flexDirection: 'column',
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: mobileOpen ? '8px 0 32px rgba(0,0,0,0.6)' : 'none',
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
          borderTop: '1px solid #383b3c',
          paddingTop: '1rem',
          marginTop: '1rem',
        }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.625rem', borderRadius: '3px',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '3px', flexShrink: 0,
                background: '#f2a638',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, color: '#191b1c', fontSize: '0.875rem',
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
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#ece8e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as React.CSSProperties}>
                  {user.name || 'User'}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7170', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="btn btn-ghost btn-full"
            style={{ justifyContent: 'flex-start', gap: '0.75rem', color: '#e0553a' }}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ─── Bottom Nav (Mobile) ──────────────────────────────── */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
        background: 'rgba(25,27,28,0.96)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid #383b3c',
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
                color: active ? '#f2a638' : '#6b7170',
                fontSize: '0.62rem',
                fontWeight: active ? 700 : 400,
                transition: 'color 0.15s',
                fontFamily: active ? "'Oswald', sans-serif" : "'Inter', sans-serif",
                letterSpacing: active ? '0.04em' : '0',
                textTransform: 'uppercase',
              }}
            >
              <div style={{
                padding: '0.3rem 0.75rem',
                borderRadius: '3px',
                background: active ? 'rgba(242,166,56,0.12)' : 'transparent',
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

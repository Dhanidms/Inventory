'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@/types';
import {
  LayoutDashboard, Package, FileText, QrCode, Users, LogOut,
  ChevronRight, Scan, Tag,
} from 'lucide-react';
import { toast } from 'sonner';

interface NavbarProps {
  user: User | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'pic'], mobilePos: 'bottom' },
  { href: '/barang', label: 'Barang', icon: Package, roles: ['admin'], mobilePos: 'bottom' },
  { href: '/kategori', label: 'Kategori', icon: Tag, roles: ['admin'], mobilePos: 'dropdown' },
  { href: '/surat-jalan', label: 'Surat Jalan', icon: FileText, roles: ['admin', 'pic'], mobilePos: 'bottom' },
  { href: '/scan', label: 'Scan QR', icon: Scan, roles: ['admin'], mobilePos: 'bottom' },
  { href: '/users', label: 'Pengguna', icon: Users, roles: ['admin'], mobilePos: 'dropdown' },
];

const SIDEBAR_WIDTH = '240px';

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const role = user?.role ?? 'pic';
  const filteredNav = NAV_ITEMS.filter(item => item.roles.includes(role));
  
  const bottomNavItems = filteredNav.filter(item => item.mobilePos === 'bottom');
  const dropdownItems = filteredNav.filter(item => item.mobilePos === 'dropdown');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Berhasil logout');
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const NavLink = ({ item, onClick }: { item: typeof NAV_ITEMS[0], onClick?: () => void }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.625rem 0.875rem',
          borderRadius: 'var(--radius-sm)',
          textDecoration: 'none',
          fontWeight: active ? 600 : 400,
          fontSize: '0.875rem',
          color: active ? 'var(--accent)' : 'var(--text-secondary)',
          background: active ? 'var(--accent-light)' : 'transparent',
          transition: 'all 0.15s',
          border: active ? '1px solid rgba(59,130,246,0.22)' : '1px solid transparent',
          fontFamily: active ? "'Oswald', sans-serif" : "'Inter', sans-serif",
          letterSpacing: active ? '0.04em' : '0',
          textTransform: active ? 'uppercase' : 'none',
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
          }
        }}
      >
        <Icon size={18} />
        <span>{item.label}</span>
        {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
      </Link>
    );
  };

  /* ─── Shared sidebar content (Desktop Only) ────────────────────── */
  const SidebarContent = () => (
    <>
      {/* Nav items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
        {filteredNav.map(item => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* User info + Logout */}
      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '1rem',
        marginTop: '1rem',
      }}>
        {user && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.25rem 0',
            marginBottom: '0.75rem',
            cursor: 'default',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', flexShrink: 0,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, color: '#ffffff', fontSize: '0.875rem',
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
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as React.CSSProperties}>
                {user.name || 'User'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-full"
          style={{ justifyContent: 'flex-start', gap: '0.75rem', color: 'var(--danger)' }}
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ─── Mobile Top Bar (hidden on desktop) ──────────────── */}
      {!isDesktop && (
        <div className="glass" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 1rem',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          {/* Logo (Left) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: 'var(--radius-sm)',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(59,130,246,0.4)',
            }}>
              <QrCode size={15} color="#ffffff" strokeWidth={2.5} />
            </div>
            <span style={{
              fontFamily: "'Oswald', sans-serif",
              fontWeight: 700,
              fontSize: '1.1rem',
              color: 'var(--text-primary)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              InvRental
            </span>
          </div>

          {/* User avatar / Dropdown trigger (Right) */}
          {user && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer'
                }}
                aria-label="Profil Menu"
              >
                <span style={{
                  background: role === 'admin' ? 'var(--accent-light)' : 'rgba(34,197,94,0.15)',
                  color: role === 'admin' ? 'var(--accent)' : 'var(--success)',
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
                <div style={{
                  width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, color: '#ffffff',
                  overflow: 'hidden',
                  boxShadow: profileDropdownOpen ? '0 0 0 2px var(--accent-light)' : 'none',
                  transition: 'box-shadow 0.2s',
                }}>
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} alt={user.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    (user.name || user.email || '?')[0].toUpperCase()
                  )}
                </div>
              </button>

              {/* Mobile Profile Dropdown */}
              {profileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.5rem)',
                  right: 0,
                  width: '200px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '0.5rem',
                  zIndex: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}>
                  {dropdownItems.length > 0 && (
                    <>
                      {dropdownItems.map(item => (
                        <NavLink key={item.href} item={item} onClick={() => setProfileDropdownOpen(false)} />
                      ))}
                      <div className="divider" style={{ margin: '0.25rem 0' }} />
                    </>
                  )}
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="btn btn-ghost btn-full"
                    style={{ justifyContent: 'flex-start', gap: '0.75rem', color: 'var(--danger)', padding: '0.625rem 0.875rem' }}
                  >
                    <LogOut size={16} />
                    Keluar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Mobile Profile Dropdown Overlay ─────────────────── */}
      {!isDesktop && profileDropdownOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 45,
          }}
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}

      {/* ─── Sidebar (Desktop Only) ───────────────────────────── */}
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIDEBAR_WIDTH,
        height: '100dvh',
        zIndex: 30,
        background: 'var(--bg-primary)',
        borderRight: '1px solid var(--border)',
        display: isDesktop ? 'flex' : 'none',
        flexDirection: 'column',
        padding: '1.25rem 0.875rem',
        overflowY: 'auto',
      }}>
        {/* Logo header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          marginBottom: '1.5rem', paddingLeft: '0.5rem',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 0 1px rgba(59,130,246,0.4)',
          }}>
            <QrCode size={16} color="#ffffff" strokeWidth={2.5} />
          </div>
          <span style={{
            fontFamily: "'Oswald', sans-serif",
            fontWeight: 700,
            fontSize: '1.15rem',
            color: 'var(--text-primary)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            InvRental
          </span>
          {user && (
            <span style={{
              marginLeft: 'auto',
              background: role === 'admin' ? 'var(--accent-light)' : 'rgba(34,197,94,0.15)',
              color: role === 'admin' ? 'var(--accent)' : 'var(--success)',
              padding: '0.1rem 0.5rem',
              borderRadius: '2px',
              fontWeight: 700,
              textTransform: 'uppercase',
              fontSize: '0.6rem',
              letterSpacing: '0.08em',
              fontFamily: "'IBM Plex Mono', monospace",
            } as React.CSSProperties}>
              {role}
            </span>
          )}
        </div>

        <SidebarContent />
      </aside>

      {/* ─── Bottom Nav (Mobile only) ─────────────────────────── */}
      {!isDesktop && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          background: 'rgba(12,18,34,0.96)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          padding: '0.5rem 0 env(safe-area-inset-bottom)',
        }}>
          {bottomNavItems.map(item => {
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
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
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
                  borderRadius: 'var(--radius-sm)',
                  background: active ? 'var(--accent-light)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                  <Icon size={20} />
                </div>
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}

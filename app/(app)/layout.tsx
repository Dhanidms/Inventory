import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AppLayoutShell from './AppLayoutShell';
import { SidebarProvider } from '@/components/SidebarContext';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', minHeight: '100dvh' }}>
        <Navbar user={userData} />
        <AppLayoutShell>
          {children}
        </AppLayoutShell>
      </div>
    </SidebarProvider>
  );
}


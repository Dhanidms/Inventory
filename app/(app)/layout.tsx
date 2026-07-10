import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';

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
    <div style={{ display: 'flex', minHeight: '100dvh' }}>
      <Navbar user={userData} />
      <main className="main-content" style={{
        flex: 1,
        marginLeft: 0,
        paddingTop: '60px', // mobile top nav height
        minWidth: 0,
      }}>
        <div className="page-container" style={{ paddingTop: '1.25rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

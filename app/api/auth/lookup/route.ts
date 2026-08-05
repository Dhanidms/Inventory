import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username diperlukan' }, { status: 400 });
    }

    // Gunakan admin key untuk membypass RLS karena user belum login
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Cari user berdasarkan nama persis (case insensitive bisa pakai ilike)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('email')
      .ilike('name', username)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Username tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ email: data.email });
  } catch (error: any) {
    console.error('Lookup error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

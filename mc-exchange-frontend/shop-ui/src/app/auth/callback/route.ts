import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/owner';

  console.log('Auth callback called with:', { code: !!code, origin, next });

  if (code) {
    const cookieStore = await cookies();
    const supabase = await supabaseServer(cookieStore);
    
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.session) {
      console.log('Auth successful, user:', data.session.user.email);
      console.log('Redirecting to:', `${origin}${next}`);
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('Auth exchange error:', error);
    }
  } else {
    console.log('No auth code provided');
  }

  console.log('Auth failed, redirecting to login with error');
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}

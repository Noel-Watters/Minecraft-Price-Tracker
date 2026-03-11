// src/app/(auth)/admin/layout.tsx
import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { supabaseServer } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Await cookies() first
  const cookieStore = await cookies();
  const supabase = await supabaseServer(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-4">
        <nav className="mb-6 p-4 bg-gray-800 rounded-lg flex items-center justify-between">
          <div className="flex gap-4">
            <Link href="/admin" className="text-blue-400 hover:underline">
              Admin Home
            </Link>
            <Link href="/admin/exchange" className="text-blue-400 hover:underline">
              Exchanges
            </Link>
          </div>
          <div className="text-sm">
            <LogoutButton />
          </div>
        </nav>
        <main className="bg-gray-800 rounded-lg p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
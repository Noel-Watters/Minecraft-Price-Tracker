"use client";
import React, { ReactNode, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import Sidebar from "@/components/Navbar/Sidebar";
import "@/styles/globals.css";
import { supabaseBrowser } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function OwnerLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('No authenticated user, redirecting to login');
          router.push('/login');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pv-surface">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pv-primary mx-auto mb-4"></div>
          <p className="text-pv-text-secondary">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
  <div className="relative min-h-screen overflow-hidden">
    <div className="relative p-2 z-10 flex items-start text-pv-text-primary">
      <Sidebar role="owner" />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  </div>
);
}

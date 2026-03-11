'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

export default function LoginPage() {
  const [origin, setOrigin] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = supabaseBrowser();

  useEffect(() => {
    // Set origin after component mounts
    setOrigin(window.location.origin);

    // Check if already logged in
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('User already logged in, redirecting to owner');
          router.push('/owner');
          return;
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, redirecting to owner');
        router.push('/owner');
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!origin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto p-4 border rounded-lg">
          <div className="animate-pulse">Loading auth...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to MC Exchange</h1>
          <p className="text-gray-600">Sign in to manage your shops and regions</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: { background: '#2563eb', color: 'white' },
                anchor: { color: '#2563eb' },
              }
            }}
            providers={['google', 'github']}
            redirectTo={`${origin}/auth/callback`}
            onlyThirdPartyProviders={false}
          />
        </div>
        
        <p className="text-center text-sm text-gray-500 mt-4">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
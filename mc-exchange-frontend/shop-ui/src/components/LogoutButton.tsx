'use client';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import { PowerIcon } from '@heroicons/react/24/outline';

export default function LogoutButton() {
  const router = useRouter();
  const supabase = supabaseBrowser();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="
        flex items-center justify-center p-2
        text-pv-text-primary hover:text-pv-accent-border
        hover:bg-pv-surface-elevated rounded transition-colors
      "
      aria-label="Logout"
      title="Logout"
      type="button"
    >
      <PowerIcon className="w-6 h-6" />
    </button>
  );
}
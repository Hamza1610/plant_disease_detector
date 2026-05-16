import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  role: 'standard' | 'developer' | 'enterprise';
  is_active: boolean;
  is_premium: boolean;
  onboarding_completed: boolean;
  profile_metadata?: string;
}

export function useUser() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        let data = await res.json();
        
        // Intercept and sync role mapping from the pilot selection portal
        const pendingRole = localStorage.getItem('pending_role');
        if (pendingRole && data.role === 'standard') {
          try {
            const syncRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/sync-role`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ role: pendingRole })
            });
            if (syncRes.ok) {
              const syncData = await syncRes.json();
              data.role = syncData.role;
            }
          } catch (syncErr) {
            console.error('Failed to auto-sync requested role:', syncErr);
          } finally {
            localStorage.removeItem('pending_role');
          }
        }

        setUser(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    setUser(null);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        localStorage.setItem('token', session.access_token);
        await fetchProfile();
      } else {
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        localStorage.setItem('token', session.access_token);
        await fetchProfile();
      } else {
        setUser(null);
        localStorage.removeItem('token');
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading, logout, refreshUser: fetchProfile };
}

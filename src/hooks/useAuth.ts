import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { isSafeLocalMode, mockUser } from '@/lib/safeLocalMode';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(isSafeLocalMode ? (mockUser as User) : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isSafeLocalMode);

  useEffect(() => {
    if (isSafeLocalMode) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isSafeLocalMode) return;
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user,
  };
};

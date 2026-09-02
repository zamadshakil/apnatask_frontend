import type { Session } from '@supabase/supabase-js';
import type { components } from '../api/schema';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { typedApi } from '../services/api';
import { supabase } from '../services/supabaseClient';
import { runtime } from '../config/runtime';

export type AppUser = components['schemas']['UserResponse'];

interface AuthState {
  session: Session | null;
  user: AppUser | null;
  loading: boolean;
  profileMissing: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileMissing, setProfileMissing] = useState(false);

  const loadProfile = useCallback(async (activeSession?: Session | null) => {
    const current = runtime.localAuthToken ? activeSession : activeSession ?? (await supabase.auth.getSession()).data.session;
    if (!current) {
      setUser(null);
      setProfileMissing(false);
      return;
    }
    const { data, response } = await typedApi.GET('/api/v2/me');
    if (response.status === 404) {
      setUser(null);
      setProfileMissing(true);
      return;
    }
    if (!data) throw new Error('Unable to load your ApnaTask profile');
    setUser(data);
    setProfileMissing(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    if (runtime.localAuthToken) {
      const localSession = {
        access_token: runtime.localAuthToken,
        refresh_token: '',
        expires_in: 86_400,
        token_type: 'bearer',
        user: { id: 'local-development-user' },
      } as Session;
      setSession(localSession);
      void loadProfile(localSession).finally(() => {
        if (mounted) setLoading(false);
      });
      return () => { mounted = false; };
    }
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      try {
        await loadProfile(data.session);
      } finally {
        if (mounted) setLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(true);
      void loadProfile(nextSession).finally(() => setLoading(false));
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user,
      loading,
      profileMissing,
      refresh: () => loadProfile(session),
      signOut: async () => {
        if (runtime.localAuthToken) {
          setSession(null);
          setUser(null);
          return;
        }
        await supabase.auth.signOut();
        setUser(null);
      },
    }),
    [loadProfile, loading, profileMissing, session, user],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useSession must be used within AuthProvider');
  return context;
}

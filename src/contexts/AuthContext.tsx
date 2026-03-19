import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const normalizeEmail = (value?: string | null) => (value ?? '').trim().toLowerCase();
const normalizeStatus = (value?: string | null) => (value ?? '').trim().toLowerCase();
const hasValidPurchase = (planStatus?: string | null, accessGranted?: boolean | null) =>
  normalizeStatus(planStatus) === 'active' || accessGranted === true;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; accessGranted: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error, accessGranted: false };
    }

    console.log('login success');

    const {
      data: { user: liveUser },
    } = await supabase.auth.getUser();

    if (!liveUser?.id) {
      console.log('no active access found');
      return { error: null, accessGranted: false };
    }

    const normalizedEmail = normalizeEmail(liveUser.email);
    let directValid = false;

    if (normalizedEmail) {
      console.log('checking user_access by normalized email');

      const { data: directRow, error: directError } = await supabase
        .from('user_access')
        .select('id, user_id, email, plan_status, access_granted')
        .ilike('email', normalizedEmail)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!directError && directRow) {
        const activePlan = normalizeStatus(directRow.plan_status) === 'active';
        directValid = hasValidPurchase(directRow.plan_status, directRow.access_granted);

        if (activePlan) {
          console.log('active plan found');
        }

        if (activePlan && !directRow.access_granted) {
          console.log('reconciling access_granted=true');
        }

        if (!directRow.user_id) {
          console.log('reconciling user_id');
        }
      }
    }

    const { data: accessData, error: accessError } = await supabase.rpc('get_current_user_access_state');

    if (accessError) {
      console.error('Erro ao validar acesso no login:', accessError);
      if (directValid) {
        console.log('access released');
        return { error: null, accessGranted: true };
      }

      console.log('no active access found');
      return { error: null, accessGranted: false };
    }

    const row = Array.isArray(accessData) ? accessData[0] : accessData;
    const accessGranted = row?.allowed === true || directValid;

    if (accessGranted) {
      console.log('access released');
    } else {
      console.log('no active access found');
    }

    return { error: null, accessGranted };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

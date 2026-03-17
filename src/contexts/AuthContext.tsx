import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { handleAuthCallback, validateAndPersistSession } from "@/lib/auth-callback";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEBUG_AUTH = import.meta.env.DEV;

function logAuthDebug(message: string, data?: unknown) {
  if (DEBUG_AUTH) {
    console.log(`[Auth Debug] ${message}`, data ?? '');
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    logAuthDebug('AuthProvider mounted, initializing auth');

    const initializeAuth = async () => {
      try {
        const callbackResult = await handleAuthCallback();
        logAuthDebug('Auth callback processed', {
          success: callbackResult.success,
          hasError: !!callbackResult.error,
        });

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          logAuthDebug('Error fetching session', error);
        }
        logAuthDebug('Initial session retrieved', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
        });
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (err) {
        logAuthDebug('Error during auth initialization', {
          message: err instanceof Error ? err.message : String(err),
        });
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logAuthDebug('Auth state changed', {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
      });
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const getRedirectUrl = () => {
        const origin = window.location.origin;
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = window.location.port;
        const baseUrl = port ? `${protocol}//${hostname}:${port}/` : `${protocol}//${hostname}/`;
        logAuthDebug('Computed redirect URL', { origin, baseUrl, port });
        return baseUrl;
      };

      const redirectUrl = getRedirectUrl();
      logAuthDebug('Starting signup', { email, redirectUrl });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        logAuthDebug('Signup error from Supabase', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        return { error: error.message };
      }

      logAuthDebug('Signup response received', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        userId: data.user?.id,
        needsConfirmation: !data.session,
      });

      if (!data.session) {
        return {
          error: 'Account created. Please check your email to verify your account before signing in.'
        };
      }

      return { error: null };

    } catch (err) {
      logAuthDebug('Signup exception caught', {
        message: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : typeof err,
      });
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      logAuthDebug('Starting signin', { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        logAuthDebug('Signin error from Supabase', {
          message: error.message,
          status: error.status,
          code: error.code,
        });
        return { error: error.message };
      }

      logAuthDebug('Signin response received', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        userId: data.user?.id,
        accessToken: data.session?.access_token ? '***' : 'missing',
      });

      if (!data.session) {
        logAuthDebug('Signin succeeded but no session returned');
        return { error: 'Login failed. Please try again.' };
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      const { data: verifyData, error: verifyError } = await supabase.auth.getSession();
      logAuthDebug('Session verification after signin', {
        hasSession: !!verifyData.session,
        verified: !!verifyData.session && verifyData.session.user.id === data.user.id,
        error: verifyError?.message,
      });

      if (!verifyData.session || verifyData.session.user.id !== data.user.id) {
        logAuthDebug('Session verification failed after signin');
        return { error: 'Session could not be established. Please try again.' };
      }

      logAuthDebug('Signin successful and verified', { userId: data.user.id });
      return { error: null };

    } catch (err) {
      logAuthDebug('Signin exception caught', {
        message: err instanceof Error ? err.message : String(err),
        type: err instanceof Error ? err.constructor.name : typeof err,
      });
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signOut = async () => {
    logAuthDebug('Starting signout');
    await supabase.auth.signOut();
    logAuthDebug('Signout completed');
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

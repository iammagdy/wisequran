import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { claimBookmarksForUser, releaseBookmarksForUser } from "@/lib/bookmarks";
import { handleAuthCallback, validateAndPersistSession } from "@/lib/auth-callback";
import { logger } from "@/lib/logger";
import { setActiveHijriUser } from "@/hooks/useRamadan";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Auth debug logs are dev-only. In production builds (import.meta.env.DEV === false),
// this constant is statically false and the entire console.log call below is removed
// by the bundler's dead-code elimination, so no `[Auth Debug]` lines reach the
// production browser console. Real failures still flow through `console.error`.
function logAuthDebug(message: string, data?: unknown): void {
  // Gated through the shared `logger` so it's a no-op in production.
  logger.debug(`[Auth] ${message}`, data ?? '');
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
        const uid = session?.user?.id ?? null;
        setActiveHijriUser(uid);
        if (uid) {
          void claimBookmarksForUser(uid).catch(() => {});
        } else {
          releaseBookmarksForUser();
        }
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
      const uid = session?.user?.id ?? null;
      setActiveHijriUser(uid);
      if (uid) {
        void claimBookmarksForUser(uid).catch(() => {});
      } else {
        releaseBookmarksForUser();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Authentication service is not configured for this domain.' };
    }
    try {
      const getRedirectUrl = () => {
        const origin = window.location.origin;
        const callbackUrl = `${origin}/auth/callback`;
        logAuthDebug('Computed redirect URL', { origin, callbackUrl });
        return callbackUrl;
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

        if (error.message.includes('contact your email') || error.message.includes('could not contact')) {
          return { error: 'Email service is temporarily unavailable. Please try again later.' };
        }

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
      if (err instanceof TypeError) {
        return { error: 'Network error. Please check your internet connection.' };
      }
      return { error: 'An unexpected error occurred. Please try again.' };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      return { error: 'Authentication service is not configured for this domain.' };
    }
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
      if (err instanceof TypeError) {
        return { error: 'Network error. Please check your internet connection.' };
      }
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

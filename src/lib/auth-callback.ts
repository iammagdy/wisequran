import { supabase } from "./supabase";

// Dev-only debug logger. `import.meta.env.DEV` is a Vite build-time constant,
// so in production builds the body below is dead-code-eliminated and no
// `[Auth Callback Debug]` messages appear in the user's console.
const DEBUG_AUTH = import.meta.env.DEV;

function logAuthDebug(message: string, data?: unknown): void {
  if (!DEBUG_AUTH) return;
  console.log(`[Auth Callback Debug] ${message}`, data ?? '');
}

export async function handleAuthCallback() {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);

  const code = params.get('code');
  const error = params.get('error');
  const errorDescription = params.get('error_description');

  logAuthDebug('Auth callback triggered', {
    hasCode: !!code,
    hasError: !!error,
    pathname: url.pathname,
  });

  if (error) {
    logAuthDebug('Auth callback error', { error, description: errorDescription });
    return { success: false, error, description: errorDescription };
  }

  if (code) {
    try {
      logAuthDebug('Processing auth code from URL');
      const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

      if (sessionError) {
        logAuthDebug('Error exchanging code for session', sessionError);
        return { success: false, error: sessionError.message };
      }

      logAuthDebug('Successfully exchanged code for session', {
        userId: data.user?.id,
        email: data.user?.email,
      });

      return { success: true, data };
    } catch (err) {
      logAuthDebug('Exception during code exchange', {
        message: err instanceof Error ? err.message : String(err),
      });
      return { success: false, error: 'Failed to process authentication' };
    }
  }

  logAuthDebug('No auth code or error in URL');
  return { success: false, error: null };
}

export async function validateAndPersistSession() {
  try {
    logAuthDebug('Validating and persisting session');

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logAuthDebug('Error retrieving session', error);
      return false;
    }

    if (!session) {
      logAuthDebug('No session found after validation');
      return false;
    }

    logAuthDebug('Session validated and persisted', {
      userId: session.user.id,
      expiresAt: session.expires_at,
    });

    return true;
  } catch (err) {
    logAuthDebug('Exception during session validation', {
      message: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export function getAuthErrorMessage(error: string | null, isRTL: boolean): string {
  if (!error) return '';

  const msg = error.toLowerCase();

  if (msg.includes('already registered') || msg.includes('already exists')) {
    return isRTL ? 'هذا البريد الإلكتروني مسجل بالفعل' : 'This email is already registered';
  }
  if (msg.includes('contact your email') || msg.includes('could not contact') || msg.includes('email service')) {
    return isRTL ? 'خدمة البريد الإلكتروني غير متاحة حاليًا' : 'Email service is temporarily unavailable';
  }
  if (msg.includes('invalid') || msg.includes('email address')) {
    return isRTL ? 'البريد الإلكتروني غير صحيح' : 'Invalid email address';
  }
  if (msg.includes('password')) {
    return isRTL ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
  }
  if (msg.includes('not found')) {
    return isRTL ? 'لم يتم العثور على هذا الحساب' : 'Account not found';
  }
  if (msg.includes('network') || msg.includes('failed to fetch')) {
    return isRTL ? 'خطأ في الاتصال. تحقق من اتصالك بالإنترنت' : 'Network error. Check your connection';
  }
  if (msg.includes('email not confirmed') || msg.includes('not verified')) {
    return isRTL ? 'يرجى تأكيد بريدك الإلكتروني' : 'Please verify your email';
  }

  return error;
}

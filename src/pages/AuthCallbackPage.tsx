import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const errorDescription = url.searchParams.get('error_description');

      if (error) {
        console.error('Auth callback error:', { error, errorDescription });
        navigate('/signin', {
          replace: true,
          state: { error: errorDescription || error }
        });
        return;
      }

      if (code) {
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Failed to exchange code:', exchangeError);
            navigate('/signin', {
              replace: true,
              state: { error: exchangeError.message }
            });
            return;
          }

          if (data.session) {
            navigate('/', { replace: true });
          } else {
            navigate('/signin', { replace: true });
          }
        } catch (err) {
          console.error('Callback exception:', err);
          navigate('/signin', {
            replace: true,
            state: { error: 'Authentication failed' }
          });
        }
      } else {
        navigate('/signin', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary/40 border-t-primary animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Verifying your account...</p>
      </div>
    </div>
  );
}

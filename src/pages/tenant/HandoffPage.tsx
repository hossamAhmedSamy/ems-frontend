import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useHandoff } from '../../hooks/useTenantAuth';
import { ApiError } from '../../lib/api';

export default function HandoffPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const handoff = useHandoff();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    handoff.mutateAsync(token).then(
      () => navigate('/', { replace: true }),
      (err) => {
        setError(err instanceof ApiError ? err.message : 'Could not complete signup');
      },
    );
  }, [token, handoff, navigate]);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {error ? (
              <>
                <ShieldAlert className="h-5 w-5 text-rose-500" />
                Couldn't finish setup
              </>
            ) : (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
                Setting up your workspace…
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <p className="text-sm text-slate-600">{error}</p>
              <p className="text-xs text-slate-500">
                Your account was created. If the handoff link timed out, sign in with the
                credentials you set during signup.
              </p>
              <Button onClick={() => navigate('/login', { replace: true })} className="w-full">
                Go to sign in
              </Button>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              We're signing you in and dropping you into your new EMS workspace.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

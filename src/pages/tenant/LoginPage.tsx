import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useTenantLogin, useTenantMe } from '../../hooks/useTenantAuth';
import { ApiError } from '../../lib/api';

interface FormValues {
  identifier: string;
  password: string;
}

interface ParsedIdentifier {
  username: string;
  companySlug: string;
}

const IDENTIFIER_RX = /^([a-zA-Z0-9._-]+)@([a-z0-9-]+)$/;

function parseIdentifier(input: string): ParsedIdentifier | { error: string } {
  const trimmed = input.trim();
  if (!trimmed.includes('@')) {
    return { error: 'Enter your sign-in as username@your-company' };
  }
  // Loud catch: someone pasting a real email like john@acme.com / john@acme.co.uk
  // The slug part should never have a dot. Pinpoint this exact mistake.
  const afterAt = trimmed.split('@').slice(1).join('@');
  if (afterAt.includes('.')) {
    return {
      error:
        'This is your workspace login, not an email. Use the form username@your-company (no dot after @).',
    };
  }
  const m = IDENTIFIER_RX.exec(trimmed);
  if (!m) {
    return { error: 'Format must be username@company (lowercase company, letters/numbers/hyphens)' };
  }
  return { username: m[1], companySlug: m[2].toLowerCase() };
}

export default function TenantLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const me = useTenantMe();
  const login = useTenantLogin();
  const [identifier, setIdentifier] = useState(() => {
    const slug = params.get('slug');
    return slug ? `@${slug}` : '';
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<FormValues>({
    defaultValues: { identifier, password: '' },
  });

  // Keep the form's identifier in sync with the controlled input so we can show
  // live parsing hints below the field without losing validation messages.
  useEffect(() => {
    setValue('identifier', identifier);
  }, [identifier, setValue]);

  useEffect(() => {
    if (me.data?.user) navigate('/', { replace: true });
  }, [me.data, navigate]);

  const parsed = useMemo(() => (identifier ? parseIdentifier(identifier) : null), [identifier]);
  const previewSlug = parsed && 'companySlug' in parsed ? parsed.companySlug : null;

  const onSubmit = handleSubmit(async (values) => {
    const result = parseIdentifier(values.identifier);
    if ('error' in result) {
      setError('identifier', { message: result.error });
      return;
    }
    try {
      await login.mutateAsync({
        companySlug: result.companySlug,
        username: result.username,
        password: values.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError('root', {
        message: err instanceof ApiError ? err.message : 'Network error',
      });
    }
  });

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.25),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-brand flex items-center justify-center shadow-card">
            <Receipt className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="mt-4 text-xl">Sign in to EMS</CardTitle>
          <CardDescription>Use your <span className="font-mono">username@workspace</span> to sign in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Sign-in</Label>
              <Input
                id="identifier"
                autoComplete="username"
                autoFocus
                placeholder="you@your-company"
                inputMode="email"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                onBlur={register('identifier').onBlur}
                name={register('identifier').name}
                ref={register('identifier').ref}
              />
              {previewSlug && !errors.identifier && (
                <p className="text-xs text-slate-500">
                  Workspace: <span className="font-mono text-slate-700">{previewSlug}</span>
                </p>
              )}
              {errors.identifier && (
                <p className="text-xs text-rose-600">{errors.identifier.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && (
                <p className="text-xs text-rose-600">{errors.password.message}</p>
              )}
            </div>
            {errors.root && (
              <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                {errors.root.message}
              </div>
            )}
            <Button type="submit" className="w-full" loading={login.isPending}>
              Sign in
            </Button>
            <div className="text-center text-xs text-slate-500 pt-1">
              New here?{' '}
              <a
                href={import.meta.env.VITE_MARKETING_URL ?? 'http://localhost:5174'}
                className="text-brand-700 hover:underline"
              >
                Create a company
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

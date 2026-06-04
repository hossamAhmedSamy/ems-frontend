import { useEffect } from 'react';
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
  companySlug: string;
  username: string;
  password: string;
}

export default function TenantLoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const me = useTenantMe();
  const login = useTenantLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    defaultValues: { companySlug: params.get('slug') ?? '' },
  });

  useEffect(() => {
    if (me.data?.user) navigate('/', { replace: true });
  }, [me.data, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
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
          <CardDescription>Enter your company workspace to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="companySlug">Company workspace</Label>
              <Input
                id="companySlug"
                autoComplete="organization"
                autoFocus
                placeholder="acme"
                {...register('companySlug', { required: 'Company slug is required' })}
              />
              {errors.companySlug && (
                <p className="text-xs text-rose-600">{errors.companySlug.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                {...register('username', { required: 'Username is required' })}
              />
              {errors.username && (
                <p className="text-xs text-rose-600">{errors.username.message}</p>
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

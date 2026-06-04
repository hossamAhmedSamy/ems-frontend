import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { useSuperLogin, useSuperMe } from '../../hooks/useSuperAuth';
import { ApiError } from '../../lib/api';
import { useEffect } from 'react';

interface FormValues {
  username: string;
  password: string;
}

export default function SuperAdminLoginPage() {
  const navigate = useNavigate();
  const me = useSuperMe();
  const login = useSuperLogin();
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormValues>();

  useEffect(() => {
    if (me.data?.superAdmin) navigate('/super-admin', { replace: true });
  }, [me.data, navigate]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      navigate('/super-admin', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError('root', { message: err.message });
      } else {
        setError('root', { message: 'Network error' });
      }
    }
  });

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.25),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
      <Card className="w-full max-w-md relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-brand flex items-center justify-center shadow-card">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="mt-4 text-xl">EMS Super Admin</CardTitle>
          <CardDescription>Sign in to manage all tenant companies.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                autoFocus
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

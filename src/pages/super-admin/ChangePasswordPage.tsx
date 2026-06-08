import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { PageHeader } from '../../components/PageHeader';
import { ApiError, api } from '../../lib/api';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Required'),
    newPassword: z.string().min(12, 'Super admin password must be at least 12 chars').max(200),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof schema>;

export default function SuperAdminChangePasswordPage() {
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await api.post('/super-admin/change-password', {
        currentPassword: v.currentPassword,
        newPassword: v.newPassword,
      });
      setDone(true);
      setTimeout(() => navigate('/super-admin/login', { replace: true }), 1200);
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Network error' });
    }
  });

  return (
    <div>
      <PageHeader
        title="Change your password"
        description="Super-admin password. You'll be signed out and need to sign in again."
      />
      <div className="px-4 md:px-8 py-6 max-w-md mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-slate-500" />
              Update password
            </CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 px-3 py-3 text-sm text-emerald-800">
                Password changed. Signing you out…
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Current password</Label>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    {...register('currentPassword')}
                  />
                  {errors.currentPassword && (
                    <p className="text-xs text-rose-600">{errors.currentPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>New password (min 12 chars)</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...register('newPassword')}
                  />
                  {errors.newPassword && (
                    <p className="text-xs text-rose-600">{errors.newPassword.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm new password</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-rose-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
                {errors.root && (
                  <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                    {errors.root.message}
                  </div>
                )}
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  Change password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

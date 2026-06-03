import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useMe } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function RequireAuth() {
  const me = useMe();
  const location = useLocation();

  if (me.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-alt">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!me.data?.superAdmin) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

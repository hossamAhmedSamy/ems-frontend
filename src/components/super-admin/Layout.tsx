import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useSuperLogout, useSuperMe } from '../../hooks/useSuperAuth';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const NAV: NavItem[] = [
  { to: '/super-admin', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: '/super-admin/companies', label: 'Companies', icon: <Building2 className="h-4 w-4" /> },
  { to: '/super-admin/audit', label: 'Audit logs', icon: <ScrollText className="h-4 w-4" /> },
];

export function SuperAdminLayout() {
  const me = useSuperMe();
  const logout = useSuperLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } finally {
      navigate('/super-admin/login', { replace: true });
    }
  };

  const sa = me.data?.superAdmin;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-surface-alt">
      <header className="md:hidden flex items-center justify-between bg-sidebar text-white px-4 h-14">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="h-5 w-5 text-brand-400" />
          <span>EMS Admin</span>
        </div>
        <button
          aria-label="Open menu"
          onClick={() => setOpen((o) => !o)}
          className="p-2 rounded-md hover:bg-sidebar-hover"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      <aside
        className={cn(
          'md:flex md:flex-col bg-sidebar text-slate-200 w-full md:w-64 md:min-h-screen md:sticky md:top-0',
          open ? 'flex flex-col' : 'hidden',
        )}
      >
        <div className="hidden md:flex items-center gap-2 px-5 h-16 border-b border-slate-700/50">
          <ShieldCheck className="h-5 w-5 text-brand-400" />
          <div>
            <div className="font-semibold text-white">EMS</div>
            <div className="text-xs text-slate-400 -mt-0.5">Super Admin</div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/super-admin'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition',
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-slate-300 hover:bg-sidebar-hover hover:text-white',
                )
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700/50">
          <div className="px-3 py-2 text-xs">
            <div className="text-slate-400 uppercase tracking-wide">Signed in</div>
            <div className="font-medium text-white truncate">{sa?.fullName ?? '—'}</div>
            <div className="text-slate-400 truncate">@{sa?.username ?? '—'}</div>
          </div>
          <Button
            variant="sidebar"
            size="sm"
            className="mt-2"
            onClick={handleLogout}
            loading={logout.isPending}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

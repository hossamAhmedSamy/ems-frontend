import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  FolderTree,
  Receipt,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/PageHeader';
import { useTenantMe } from '../../hooks/useTenantAuth';
import { useBranches } from '../../hooks/useTenantBranches';
import { useTenantUsers } from '../../hooks/useTenantUsers';
import { useCategories } from '../../hooks/useTenantCategories';
import { useExpenses } from '../../hooks/useTenantExpenses';
import { hasPermission } from '../../lib/permissions';
import { formatMoney } from '../../lib/utils';
import { useMemo } from 'react';

export default function TenantDashboardPage() {
  const me = useTenantMe();
  const user = me.data?.user;
  const branches = useBranches();
  const users = useTenantUsers();
  const cats = useCategories();
  const recent = useExpenses({ pageSize: 5 });

  const branchCount = branches.data?.items.length ?? 0;
  const userCount = users.data?.items.length ?? 0;
  const catCount = cats.data?.items.length ?? 0;
  const expenseTotal = recent.data?.total ?? 0;
  const recentItems = recent.data?.items ?? [];

  const monthTotal = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return recentItems
      .filter((e) => new Date(e.expenseDate).getTime() >= cutoff.getTime())
      .reduce((s, e) => s + parseFloat(e.amount || '0'), 0);
  }, [recentItems]);

  const canManageUsers = hasPermission(user, 'users:manage');
  const canManageBranches = hasPermission(user, 'branches:manage');

  const steps = [
    {
      done: branchCount > 0,
      label: 'Add a branch',
      cta: 'Add branch',
      href: '/branches',
      enabled: canManageBranches,
    },
    {
      done: catCount > 0,
      label: 'Add an expense category',
      cta: 'Add category',
      href: '/expense-categories',
      enabled: true,
    },
    {
      done: expenseTotal > 0,
      label: 'Record your first expense',
      cta: 'New expense',
      href: '/expenses',
      enabled: branchCount > 0 && catCount > 0,
    },
    {
      done: userCount > 1,
      label: 'Invite a teammate',
      cta: 'Add user',
      href: '/users',
      enabled: canManageUsers,
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;

  return (
    <div>
      <PageHeader
        title={user ? `Welcome, ${user.fullName.split(' ')[0]}` : 'Welcome'}
        description="Your EMS workspace at a glance."
      />
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat
            icon={<Receipt className="h-5 w-5 text-brand" />}
            label="Expenses (last 30d)"
            value={formatMoney(monthTotal)}
            sub={`${expenseTotal} total in workspace`}
          />
          <Stat
            icon={<Building2 className="h-5 w-5 text-emerald-500" />}
            label="Branches"
            value={branchCount.toLocaleString()}
            sub={branchCount === 0 ? 'add your first' : 'across regions'}
          />
          <Stat
            icon={<FolderTree className="h-5 w-5 text-amber-500" />}
            label="Categories"
            value={catCount.toLocaleString()}
            sub={catCount === 0 ? 'add your first' : 'for classification'}
          />
          <Stat
            icon={<Users className="h-5 w-5 text-violet-500" />}
            label="Team members"
            value={userCount.toLocaleString()}
            sub={userCount === 1 ? 'just you' : 'on the workspace'}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Recent expenses</CardTitle>
              <Link
                to="/expenses"
                className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                See all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              {recentItems.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">
                  No expenses recorded yet.{' '}
                  <Link to="/expenses" className="text-brand-700 underline">
                    Record one
                  </Link>
                  .
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 -mx-5">
                  {recentItems.map((e) => (
                    <li key={e.id} className="px-5 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{e.description}</div>
                        <div className="text-xs text-slate-500">
                          {e.expenseDate.slice(0, 10)} ·{' '}
                          <span className="font-mono">{e.branchId.slice(0, 12)}…</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-semibold text-slate-900">
                          {formatMoney(e.amount)}
                        </div>
                        <Badge tone={e.status === 'Approved' ? 'success' : 'neutral'}>
                          {e.status}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Onboarding</CardTitle>
              <Badge tone="info">
                {completedSteps} / {steps.length}
              </Badge>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {steps.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-start gap-3 py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 flex-shrink-0 mt-0.5 ${s.done ? 'text-emerald-500' : 'text-slate-300'}`}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm ${s.done ? 'text-slate-500 line-through' : 'text-slate-900'}`}
                      >
                        {s.label}
                      </div>
                      {!s.done && s.enabled && (
                        <Link
                          to={s.href}
                          className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                        >
                          {s.cta} <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function Stat({ icon, label, value, sub }: StatProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">{label}</div>
          {icon}
        </div>
        <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

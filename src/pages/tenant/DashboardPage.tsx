import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/PageHeader';
import { BranchBars, CategoryDonut, TrendChart } from '../../components/tenant/DashboardCharts';
import { useTenantMe } from '../../hooks/useTenantAuth';
import { useTenantDashboard } from '../../hooks/useTenantDashboard';
import { useBranches } from '../../hooks/useTenantBranches';
import { useTenantUsers } from '../../hooks/useTenantUsers';
import { useCategories } from '../../hooks/useTenantCategories';
import { useExpenses } from '../../hooks/useTenantExpenses';
import { hasPermission } from '../../lib/permissions';
import { formatMoney } from '../../lib/utils';

export default function TenantDashboardPage() {
  const me = useTenantMe();
  const user = me.data?.user;
  const canSeeExpenses = hasPermission(user, 'expenses:read');
  const dashboard = useTenantDashboard(canSeeExpenses);
  const d = dashboard.data;
  const currency = d?.currency ?? 'USD';

  return (
    <div>
      <PageHeader
        title={user ? `Welcome, ${user.fullName.split(' ')[0]}` : 'Welcome'}
        description="Your EMS workspace at a glance."
      />
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto w-full space-y-6">
        {canSeeExpenses && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat
                label="This month"
                value={formatMoney(d?.kpis.thisMonthTotal ?? 0, currency)}
                sub={
                  d?.kpis.eomProjection != null
                    ? `≈ ${formatMoney(d.kpis.eomProjection, currency)} by month end (est.)`
                    : undefined
                }
                badge={
                  d?.kpis.momPct != null ? (
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                        d.kpis.momPct > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {d.kpis.momPct > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(d.kpis.momPct)}%
                    </span>
                  ) : undefined
                }
              />
              <Stat
                label="Avg monthly (6m)"
                value={formatMoney(d?.kpis.avgMonthly ?? 0, currency)}
                sub={`last month ${formatMoney(d?.kpis.lastMonthTotal ?? 0, currency)}`}
              />
              <Stat
                label="Expense records"
                value={(d?.kpis.totalRecords ?? 0).toLocaleString()}
                sub="all time"
              />
              <Stat
                label="Active branches"
                value={(d?.kpis.activeBranches ?? 0).toLocaleString()}
                sub={d && d.kpis.activeBranches === 0 ? 'add your first' : 'in your scope'}
              />
            </div>

            {(d?.insights.anomalies.length ?? 0) > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-800 text-sm font-medium mb-2">
                  <AlertTriangle className="h-4 w-4" /> Unusual spending this month
                </div>
                <ul className="space-y-1">
                  {d!.insights.anomalies.slice(0, 4).map((a) => (
                    <li key={`${a.kind}-${a.id}`} className="text-sm text-amber-900">
                      <span className="font-medium">{a.name}</span>{' '}
                      <span className="text-amber-700">
                        ({a.kind}) is {a.pct}% above its usual{' '}
                        {formatMoney(a.baseline, currency)} — at{' '}
                        {formatMoney(a.current, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Spending trend</CardTitle>
                <span className="text-xs text-slate-500">last 12 months</span>
              </CardHeader>
              <CardContent>
                {dashboard.isLoading ? (
                  <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
                ) : (
                  <TrendChart data={d?.trend ?? []} currency={currency} />
                )}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>By category — this month</CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryDonut data={d?.byCategory ?? []} currency={currency} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle>By branch</CardTitle>
                  <span className="text-xs text-slate-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-brand mr-1" />
                    this month
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-300 ml-3 mr-1" />
                    last month
                  </span>
                </CardHeader>
                <CardContent>
                  <BranchBars data={d?.byBranch ?? []} currency={currency} />
                </CardContent>
              </Card>
            </div>

            {(d?.insights.topCategory || d?.insights.biggestMover) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {d?.insights.topCategory && (
                  <Insight
                    icon={<Receipt className="h-4 w-4 text-brand" />}
                    label="Top category"
                    value={d.insights.topCategory.name}
                    sub={formatMoney(d.insights.topCategory.total, currency)}
                  />
                )}
                {d?.insights.topBranch && (
                  <Insight
                    icon={<Building2 className="h-4 w-4 text-emerald-500" />}
                    label="Top branch"
                    value={d.insights.topBranch.name}
                    sub={formatMoney(d.insights.topBranch.total, currency)}
                  />
                )}
                {d?.insights.biggestMover && (
                  <Insight
                    icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
                    label="Biggest mover"
                    value={d.insights.biggestMover.name}
                    sub={
                      d.insights.biggestMover.pct != null
                        ? `+${formatMoney(d.insights.biggestMover.delta, currency)} (+${d.insights.biggestMover.pct}%) vs last month`
                        : `+${formatMoney(d.insights.biggestMover.delta, currency)} — new spend`
                    }
                  />
                )}
              </div>
            )}
          </>
        )}

        <BottomRow currency={currency} totalRecords={d?.kpis.totalRecords ?? 0} />
      </div>
    </div>
  );
}

function BottomRow({ currency, totalRecords }: { currency: string; totalRecords: number }) {
  const me = useTenantMe();
  const user = me.data?.user;
  const branches = useBranches();
  const users = useTenantUsers(hasPermission(user, 'users:read'));
  const cats = useCategories();
  const recent = useExpenses({ pageSize: 5 });

  const branchCount = branches.data?.items.length ?? 0;
  const catCount = cats.data?.items.length ?? 0;
  const userCount = users.data?.items.length ?? 0;
  const recentItems = recent.data?.items ?? [];

  const canManageUsers = hasPermission(user, 'users:manage');
  const canManageBranches = hasPermission(user, 'branches:manage');

  const steps = [
    { done: branchCount > 0, label: 'Add a branch', cta: 'Add branch', href: '/branches', enabled: canManageBranches },
    { done: catCount > 0, label: 'Add an expense category', cta: 'Add category', href: '/expense-categories', enabled: true },
    { done: totalRecords > 0, label: 'Record your first expense', cta: 'New expense', href: '/expenses', enabled: branchCount > 0 && catCount > 0 },
    { done: userCount > 1, label: 'Invite a teammate', cta: 'Add user', href: '/users', enabled: canManageUsers },
  ];
  const completedSteps = steps.filter((s) => s.done).length;
  const onboardingDone = completedSteps === steps.length;

  return (
    <div className={`grid gap-6 ${onboardingDone ? '' : 'lg:grid-cols-3'}`}>
      <Card className={onboardingDone ? '' : 'lg:col-span-2'}>
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
                    <div className="text-xs text-slate-500">{e.expenseDate.slice(0, 10)}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-slate-900">
                      {formatMoney(e.amount, currency)}
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

      {!onboardingDone && (
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
                    <div className={`text-sm ${s.done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
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
      )}
    </div>
  );
}

function Insight({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="font-medium text-slate-900 truncate">{value}</div>
          <div className="text-xs text-slate-500">{sub}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: string;
  sub?: string;
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-500">{label}</div>
          {badge}
        </div>
        <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
        {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

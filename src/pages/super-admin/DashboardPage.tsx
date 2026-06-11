import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Building2,
  CreditCard,
  Receipt,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useCompanies } from '../../hooks/useCompanies';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useSuperAdminStats } from '../../hooks/useSuperAdminStats';
import { CompanyStatusBadge, SubscriptionTierBadge } from '../../components/StatusBadges';
import { relativeTime } from '../../lib/utils';
import { PageHeader } from '../../components/PageHeader';

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en', {
    month: 'short',
    timeZone: 'UTC',
  });
}

export default function DashboardPage() {
  const stats = useSuperAdminStats();
  const companies = useCompanies({ pageSize: 50 });
  const audit = useAuditLogs({ pageSize: 8 });

  const s = stats.data;
  const items = companies.data?.items ?? [];
  const companyNameById = new Map(items.map((i) => [i.company.id, i.company.name]));
  const growth = (s?.growth ?? []).map((g) => ({ ...g, label: monthLabel(g.month) }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="At-a-glance health of the whole platform."
      />
      <div className="px-4 md:px-8 pb-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Building2 className="h-5 w-5 text-brand" />}
            label="Total tenants"
            value={s?.platform.totalCompanies ?? 0}
            sub={`+${s?.platform.newThisMonth ?? 0} this month · ${s?.platform.activeCompanies ?? 0} active`}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
            label="Paid tiers"
            value={s?.platform.paidActive ?? 0}
            sub={`${s?.platform.trialing ?? 0} trialing · ${s?.platform.tiers.Free ?? 0} free`}
          />
          <StatCard
            icon={<ShieldAlert className="h-5 w-5 text-amber-500" />}
            label="Suspended"
            value={s?.platform.suspendedCompanies ?? 0}
            sub={`${s?.platform.disabledCompanies ?? 0} disabled`}
            tone={(s?.platform.suspendedCompanies ?? 0) > 0 ? 'warning' : undefined}
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-violet-500" />}
            label="Tenant users"
            value={s?.usage.totalUsers ?? 0}
            sub={`${s?.usage.usersActiveToday ?? 0} active today`}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity className="h-5 w-5 text-sky-500" />}
            label="Live sessions"
            value={s?.usage.liveSessions ?? 0}
          />
          <StatCard
            icon={<Receipt className="h-5 w-5 text-brand" />}
            label="Expenses today"
            value={s?.usage.expensesToday ?? 0}
            sub={`${s?.usage.expensesThisMonth ?? 0} this month`}
          />
          <StatCard
            icon={<ShieldAlert className="h-5 w-5 text-rose-500" />}
            label="Failed logins (24h)"
            value={s?.security.failedLogins24h ?? 0}
            sub={`${s?.security.failedLogins7d ?? 0} in 7 days`}
            tone={(s?.security.failedLogins24h ?? 0) > 10 ? 'warning' : undefined}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
            label="Signups (7d)"
            value={s?.security.signupSuccesses7d ?? 0}
            sub={`${s?.security.signupAttempts7d ?? 0} attempts`}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Growth</CardTitle>
              <span className="text-xs text-slate-500">last 6 months</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={growth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" hide />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line yAxisId="left" type="monotone" dataKey="companies" name="New tenants" stroke="#4F46E5" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="users" name="New users" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="expenses" name="Expenses created" stroke="#F59E0B" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {[
                  ['MRR', s?.revenue.mrr],
                  ['ARR', s?.revenue.arr],
                  ['Churn', s?.revenue.churnPct],
                  ['Trial → paid', s?.revenue.conversionPct],
                ].map(([label, v]) => (
                  <div key={label as string} className="flex items-center justify-between">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="text-sm font-medium text-slate-400">
                      {v == null ? '—' : String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="text-xs text-slate-400 mt-4">
                Fills in automatically once Stripe billing is connected.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Most active tenants</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 -mx-5">
                {(s?.usage.topTenants ?? []).map((t) => (
                  <li key={t.id} className="px-5 py-2.5 flex items-center justify-between gap-3">
                    <Link
                      to={`/super-admin/companies/${t.id}`}
                      className="text-sm font-medium text-slate-900 hover:text-brand-700 truncate"
                    >
                      {t.name}
                    </Link>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {t.expenseCount} expense{t.expenseCount === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
                {(s?.usage.topTenants.length ?? 0) === 0 && !stats.isLoading && (
                  <li className="px-5 py-6 text-sm text-slate-500 text-center">
                    No activity this month.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Recent companies</CardTitle>
              <Link
                to="/super-admin/companies"
                className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                See all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 -mx-5">
                {items.slice(0, 6).map((i) => (
                  <li key={i.company.id} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/super-admin/companies/${i.company.id}`}
                        className="font-medium text-slate-900 hover:text-brand-700 truncate block"
                      >
                        {i.company.name}
                      </Link>
                      <div className="text-xs text-slate-500 truncate">
                        @{i.company.slug} · {i.userCount} user{i.userCount === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {i.subscription && <SubscriptionTierBadge tier={i.subscription.tier} />}
                      <CompanyStatusBadge status={i.company.status} />
                    </div>
                  </li>
                ))}
                {items.length === 0 && !companies.isLoading && (
                  <li className="px-5 py-6 text-sm text-slate-500 text-center">
                    No companies yet.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Latest activity</CardTitle>
              <Link
                to="/super-admin/audit"
                className="text-xs text-brand-700 hover:underline inline-flex items-center gap-1"
              >
                Full log <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-slate-100 -mx-5">
                {audit.data?.items.map((a) => (
                  <li key={a.id} className="px-5 py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm text-slate-900 truncate">
                        <span className="font-medium">{a.action}</span>{' '}
                        <span className="text-slate-500">{a.entityName}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {companyNameById.get(a.companyId) ?? a.companyId}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 flex-shrink-0">
                      {relativeTime(a.performedAt)}
                    </div>
                  </li>
                ))}
                {(!audit.data || audit.data.items.length === 0) && !audit.isLoading && (
                  <li className="px-5 py-6 text-sm text-slate-500 text-center">
                    No activity yet.
                  </li>
                )}
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
  value: number;
  sub?: string;
  tone?: 'warning';
}

function StatCard({ icon, label, value, sub, tone }: StatProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">{label}</div>
          <div>{icon}</div>
        </div>
        <div
          className={`mt-2 text-2xl font-semibold ${tone === 'warning' ? 'text-amber-600' : 'text-slate-900'}`}
        >
          {value.toLocaleString()}
        </div>
        {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

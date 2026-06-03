import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUpRight,
  Building2,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useCompanies } from '../hooks/useCompanies';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { CompanyStatusBadge, SubscriptionTierBadge } from '../components/StatusBadges';
import { relativeTime } from '../lib/utils';
import { PageHeader } from '../components/PageHeader';

export default function DashboardPage() {
  const companies = useCompanies({ pageSize: 200 });
  const audit = useAuditLogs({ pageSize: 8 });

  const items = companies.data?.items ?? [];
  const total = companies.data?.total ?? 0;
  const counts = {
    active: items.filter((i) => i.company.status === 'Active').length,
    suspended: items.filter((i) => i.company.status === 'Suspended').length,
    disabled: items.filter((i) => i.company.status === 'Disabled').length,
    free: items.filter((i) => i.subscription?.tier === 'Free').length,
    pro: items.filter((i) => i.subscription?.tier === 'Pro').length,
    ultimate: items.filter((i) => i.subscription?.tier === 'Ultimate').length,
    users: items.reduce((s, i) => s + i.userCount, 0),
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="At-a-glance health of all tenant companies."
      />
      <div className="px-4 md:px-8 pb-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Building2 className="h-5 w-5 text-brand" />}
            label="Total tenants"
            value={total}
            sub={`${counts.active} active`}
          />
          <StatCard
            icon={<ShieldAlert className="h-5 w-5 text-amber-500" />}
            label="Suspended"
            value={counts.suspended}
            sub={`${counts.disabled} disabled`}
            tone={counts.suspended > 0 ? 'warning' : undefined}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
            label="Paid tiers"
            value={counts.pro + counts.ultimate}
            sub={`${counts.pro} Pro · ${counts.ultimate} Ultimate`}
          />
          <StatCard
            icon={<Activity className="h-5 w-5 text-violet-500" />}
            label="Total tenant users"
            value={counts.users}
            sub={`${counts.free} on Free tier`}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Recent companies</CardTitle>
              <Link
                to="/companies"
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
                        to={`/companies/${i.company.id}`}
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
                to="/audit"
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
                        <span className="text-slate-500">{a.entityName}</span>{' '}
                        <span className="text-slate-400">·</span>{' '}
                        <span className="text-slate-500 font-mono text-xs">{a.entityId}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {a.companyId}
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

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  CircleSlash,
  PauseCircle,
  PlayCircle,
  Power,
  Users,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { SelectField } from '../../components/ui/Select';
import { PageHeader } from '../../components/PageHeader';
import {
  CompanyStatusBadge,
  SubscriptionStatusBadge,
  SubscriptionTierBadge,
} from '../../components/StatusBadges';
import {
  useCompany,
  useUpdateCompanyStatus,
  useUpdateSubscription,
} from '../../hooks/useCompanies';
import { formatDateTime } from '../../lib/utils';
import type { CompanyStatus, SubscriptionTier } from '../../lib/types';

const STATUS_LABEL: Record<CompanyStatus, string> = {
  Active: 'Active',
  Suspended: 'Suspended',
  Disabled: 'Disabled',
};

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const company = useCompany(id);
  const updateStatus = useUpdateCompanyStatus(id ?? '');
  const updateSub = useUpdateSubscription(id ?? '');

  const [pendingStatus, setPendingStatus] = useState<CompanyStatus | null>(null);

  if (!id) return null;
  if (company.isLoading) {
    return <CenterMessage>Loading company…</CenterMessage>;
  }
  if (company.error) {
    return (
      <CenterMessage>
        Couldn't load this company.{' '}
        <Link to="/super-admin/companies" className="text-brand-700 underline">
          Back
        </Link>
      </CenterMessage>
    );
  }
  const data = company.data;
  if (!data) return null;

  const handleStatusChange = async () => {
    if (!pendingStatus) return;
    try {
      await updateStatus.mutateAsync({ status: pendingStatus });
    } finally {
      setPendingStatus(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={data.company.name}
        description={
          <span className="font-mono text-xs text-slate-500">@{data.company.slug}</span>
        }
        actions={
          <Button variant="secondary" onClick={() => navigate('/super-admin/companies')}>
            <ArrowLeft className="h-4 w-4" />
            All companies
          </Button>
        }
      />

      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto w-full grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tenant status</CardTitle>
                <CompanyStatusBadge status={data.company.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <StatusButton
                  active={data.company.status === 'Active'}
                  onClick={() => setPendingStatus('Active')}
                  icon={<PlayCircle className="h-4 w-4" />}
                  label="Active"
                  tone="emerald"
                />
                <StatusButton
                  active={data.company.status === 'Suspended'}
                  onClick={() => setPendingStatus('Suspended')}
                  icon={<PauseCircle className="h-4 w-4" />}
                  label="Suspend"
                  tone="amber"
                />
                <StatusButton
                  active={data.company.status === 'Disabled'}
                  onClick={() => setPendingStatus('Disabled')}
                  icon={<Power className="h-4 w-4" />}
                  label="Disable"
                  tone="rose"
                  className="col-span-2"
                />
              </div>
              {pendingStatus && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <div className="font-medium">
                    Confirm flip to{' '}
                    <span className="font-semibold">{STATUS_LABEL[pendingStatus]}</span>?
                  </div>
                  <div className="mt-1 text-xs">
                    {pendingStatus !== 'Active'
                      ? 'All active tenant sessions will be terminated immediately.'
                      : 'Tenants will be able to sign in again.'}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleStatusChange}
                      loading={updateStatus.isPending}
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingStatus(null)}
                      disabled={updateStatus.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Subscription</CardTitle>
                {data.subscription && (
                  <div className="flex items-center gap-2">
                    <SubscriptionTierBadge tier={data.subscription.tier} />
                    <SubscriptionStatusBadge status={data.subscription.status} />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {data.subscription ? (
                <>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <DD label="Trial ends">
                      {data.subscription.trialEndsAt
                        ? formatDateTime(data.subscription.trialEndsAt)
                        : '—'}
                    </DD>
                    <DD label="Current period ends">
                      {data.subscription.currentPeriodEndsAt
                        ? formatDateTime(data.subscription.currentPeriodEndsAt)
                        : '—'}
                    </DD>
                    <DD label="Billing email">{data.subscription.billingEmail ?? '—'}</DD>
                    <DD label="Stripe customer">
                      <span className="font-mono text-xs">
                        {data.subscription.stripeCustomerId ?? '—'}
                      </span>
                    </DD>
                  </dl>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Label small>Override tier</Label>
                    <div className="mt-2 max-w-xs">
                      <SelectField
                        value={data.subscription.tier}
                        onValueChange={(v) =>
                          updateSub.mutate({ tier: v as SubscriptionTier })
                        }
                        options={[
                          { value: 'Free', label: 'Free' },
                          { value: 'Pro', label: 'Pro' },
                          { value: 'Ultimate', label: 'Ultimate' },
                        ]}
                        disabled={updateSub.isPending}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">No subscription record.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                Users
                <span className="text-sm text-slate-500 font-normal">
                  ({data.users.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.users.length === 0 ? (
                <p className="text-sm text-slate-500">No users.</p>
              ) : (
                <ul className="divide-y divide-slate-100 -mx-5">
                  {data.users.map((u) => (
                    <li key={u.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900">{u.fullName}</div>
                        <div className="text-xs text-slate-500">
                          @{u.username}
                          {u.email ? ` · ${u.email}` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                          {u.role}
                        </span>
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <CircleSlash className="h-3 w-3" />
                            Disabled
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                Identifiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-y-3 text-sm">
                <DD label="Company id" mono>
                  {data.company.id}
                </DD>
                <DD label="Slug" mono>
                  {data.company.slug}
                </DD>
                <DD label="Onboarding">{data.company.onboardingStatus}</DD>
                <DD
                  label="Onboarding completed"
                  icon={<Calendar className="h-3 w-3 text-slate-400" />}
                >
                  {data.company.onboardingCompletedAt
                    ? formatDateTime(data.company.onboardingCompletedAt)
                    : '—'}
                </DD>
                <DD label="Created">{formatDateTime(data.company.createdAt)}</DD>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                to={`/super-admin/audit?companyId=${data.company.id}`}
                className="text-sm text-brand-700 underline"
              >
                View audit log for this tenant →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CenterMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-12 text-center text-sm text-slate-500">{children}</div>
  );
}

function Label({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      className={
        small
          ? 'text-xs font-medium uppercase tracking-wide text-slate-500'
          : 'text-sm font-medium text-slate-700'
      }
    >
      {children}
    </div>
  );
}

function DD({
  label,
  children,
  mono,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500 flex items-center gap-1">
        {icon}
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-slate-900 break-all ${mono ? 'font-mono text-xs' : 'text-sm'}`}
      >
        {children}
      </dd>
    </div>
  );
}

function StatusButton({
  active,
  onClick,
  icon,
  label,
  tone,
  className,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: 'emerald' | 'amber' | 'rose';
  className?: string;
}) {
  const toneClass = {
    emerald: 'border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300',
    amber: 'border-amber-200 hover:bg-amber-50 hover:border-amber-300',
    rose: 'border-rose-200 hover:bg-rose-50 hover:border-rose-300',
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={active}
      className={`rounded-md border bg-white px-3 py-2 text-sm font-medium text-slate-700 transition flex items-center justify-center gap-2 ${toneClass} ${active ? 'opacity-60 cursor-default' : ''} ${className ?? ''}`}
    >
      {icon}
      {label}
    </button>
  );
}

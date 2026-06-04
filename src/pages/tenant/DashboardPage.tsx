import {
  ArrowUpRight,
  Building2,
  Receipt,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/PageHeader';
import { useTenantMe } from '../../hooks/useTenantAuth';

const NEXT_STEPS = [
  {
    icon: <Building2 className="h-4 w-4 text-brand" />,
    label: 'Add your first branch',
    helper: 'Branches are where expenses are recorded.',
    cta: 'Add branch',
  },
  {
    icon: <Receipt className="h-4 w-4 text-brand" />,
    label: 'Record your first expense',
    helper: 'Capture spending day-by-day with categories, tags and attachments.',
    cta: 'Add expense',
  },
  {
    icon: <Users className="h-4 w-4 text-brand" />,
    label: 'Invite your team',
    helper: 'Add admins, branch managers, data entry and finance roles.',
    cta: 'Invite users',
  },
  {
    icon: <Sparkles className="h-4 w-4 text-brand" />,
    label: 'Try the AI assistant',
    helper: "Ask 'what's my Cairo branch spending this month?' (coming soon).",
    cta: 'Soon',
    disabled: true,
  },
];

export default function TenantDashboardPage() {
  const me = useTenantMe();
  const user = me.data?.user;

  return (
    <div>
      <PageHeader
        title={user ? `Welcome, ${user.fullName.split(' ')[0]}` : 'Welcome'}
        description="Your EMS workspace is ready. Here's what to do next."
      />
      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Get started</CardTitle>
              <Badge tone="info">v0.2 — signup loop</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            {NEXT_STEPS.map((step) => (
              <div
                key={step.label}
                className={`rounded-lg border border-slate-200 p-4 transition ${
                  step.disabled ? 'opacity-60' : 'hover:border-brand-200 hover:bg-brand-50/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-md bg-brand-50 flex items-center justify-center flex-shrink-0">
                    {step.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{step.label}</div>
                    <p className="text-xs text-slate-500 mt-0.5">{step.helper}</p>
                    <button
                      disabled={step.disabled}
                      className="mt-2 text-xs font-medium text-brand-700 hover:underline inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {step.cta}
                      {!step.disabled && <ArrowUpRight className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your workspace</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? (
              <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <DD label="Company id">
                  <span className="font-mono text-xs">{user.companyId}</span>
                </DD>
                <DD label="Your role">{user.role}</DD>
                <DD label="Full name">{user.fullName}</DD>
                <DD label="Username">@{user.username}</DD>
                <DD label="Email">{user.email ?? '—'}</DD>
                <DD label="Branch">{user.branchId ?? 'unassigned'}</DD>
              </dl>
            ) : (
              <div className="text-sm text-slate-500">Loading…</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DD({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-900">{children}</dd>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Plus, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { SelectField } from '../components/ui/Select';
import { PageHeader } from '../components/PageHeader';
import {
  CompanyStatusBadge,
  SubscriptionStatusBadge,
  SubscriptionTierBadge,
} from '../components/StatusBadges';
import { useCompanies } from '../hooks/useCompanies';
import { CreateCompanyModal } from './CreateCompanyModal';
import { formatDateTime } from '../lib/utils';
import type { CompanyStatus, SubscriptionTier } from '../lib/types';

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<CompanyStatus | ''>('');
  const [tier, setTier] = useState<SubscriptionTier | ''>('');
  const [createOpen, setCreateOpen] = useState(false);

  const companies = useCompanies({
    page,
    pageSize: 25,
    q: q || undefined,
    status: (status || undefined) as CompanyStatus | undefined,
    tier: (tier || undefined) as SubscriptionTier | undefined,
  });

  return (
    <div>
      <PageHeader
        title="Companies"
        description="Every tenant on the platform. Click a row to open details."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New company
          </Button>
        }
      />

      <div className="px-4 md:px-8 py-6 space-y-4 max-w-7xl mx-auto w-full">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name or slug…"
                value={q}
                onChange={(e) => {
                  setPage(1);
                  setQ(e.target.value);
                }}
                className="pl-9"
              />
            </div>
            <div className="md:col-span-3">
              <SelectField
                value={status || undefined}
                onValueChange={(v) => {
                  setPage(1);
                  setStatus(v === 'all' ? '' : (v as CompanyStatus));
                }}
                placeholder="Any status"
                options={[
                  { value: 'all', label: 'Any status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Suspended', label: 'Suspended' },
                  { value: 'Disabled', label: 'Disabled' },
                ]}
              />
            </div>
            <div className="md:col-span-3">
              <SelectField
                value={tier || undefined}
                onValueChange={(v) => {
                  setPage(1);
                  setTier(v === 'all' ? '' : (v as SubscriptionTier));
                }}
                placeholder="Any tier"
                options={[
                  { value: 'all', label: 'Any tier' },
                  { value: 'Free', label: 'Free' },
                  { value: 'Pro', label: 'Pro' },
                  { value: 'Ultimate', label: 'Ultimate' },
                ]}
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 font-medium">Subscription</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Users</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.data?.items.map((item) => (
                  <tr
                    key={item.company.id}
                    className="hover:bg-surface-alt transition cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link to={`/companies/${item.company.id}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {item.company.name}
                            </div>
                            <div className="text-xs text-slate-500 truncate font-mono">
                              @{item.company.slug}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <CompanyStatusBadge status={item.company.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.subscription && (
                          <>
                            <SubscriptionTierBadge tier={item.subscription.tier} />
                            <SubscriptionStatusBadge status={item.subscription.status} />
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-700">
                      {item.userCount}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-500 text-xs">
                      {formatDateTime(item.company.createdAt)}
                    </td>
                  </tr>
                ))}
                {!companies.isLoading && companies.data?.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No companies match those filters.
                    </td>
                  </tr>
                )}
                {companies.isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {companies.data && companies.data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 text-sm">
              <div className="text-slate-500">
                Page {companies.data.page} of {companies.data.totalPages} · {companies.data.total} total
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= companies.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <CreateCompanyModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

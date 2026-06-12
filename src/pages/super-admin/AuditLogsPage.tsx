import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { SelectField } from '../../components/ui/Select';
import { Label } from '../../components/ui/Label';
import { PageHeader } from '../../components/PageHeader';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { formatDateTime } from '../../lib/utils';

type ActionFilter = '' | 'Create' | 'Update' | 'Delete';

export default function AuditLogsPage() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const companyId = params.get('companyId') ?? '';
  const entityName = params.get('entityName') ?? '';
  const action = (params.get('action') ?? '') as ActionFilter;
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  const audit = useAuditLogs({
    page,
    pageSize: 50,
    companyId: companyId || undefined,
    entityName: entityName || undefined,
    action: action || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to + 'T23:59:59.999Z').toISOString() : undefined,
  });

  const update = (key: string, value: string) => {
    setPage(1);
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Append-only event stream across every tenant."
      />

      <div className="px-4 md:px-8 py-6 space-y-4 max-w-7xl mx-auto w-full">
        <Card className="p-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Company id</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="co_…"
                  value={companyId}
                  onChange={(e) => update('companyId', e.target.value)}
                  className="pl-9 font-mono text-xs"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Entity</Label>
              <Input
                placeholder="expense, branch, user, …"
                value={entityName}
                onChange={(e) => update('entityName', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Action</Label>
              <SelectField
                value={action || 'all'}
                onValueChange={(v) => update('action', v === 'all' ? '' : v)}
                options={[
                  { value: 'all', label: 'Any action' },
                  { value: 'Create', label: 'Create' },
                  { value: 'Update', label: 'Update' },
                  { value: 'Delete', label: 'Delete' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => update('from', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => update('to', e.target.value)}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Company</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit.data?.items.map((a) => (
                  <tr key={a.id} className="hover:bg-surface-alt">
                    <td className="px-4 py-3 text-slate-700 text-xs whitespace-nowrap">
                      {formatDateTime(a.performedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          a.action === 'Create'
                            ? 'success'
                            : a.action === 'Update'
                              ? 'info'
                              : 'danger'
                        }
                      >
                        {a.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-900">{a.entityName}</div>
                      <div className="font-mono text-xs text-slate-500 truncate max-w-[14rem]">
                        {a.entityId}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-500 truncate max-w-[14rem]">
                      {a.companyId}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-600 truncate max-w-[12rem]">
                      {a.performerName ?? (
                        <span className="font-mono text-slate-500">{a.performedBy ?? '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!audit.isLoading && (audit.data?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No events match your filters.
                    </td>
                  </tr>
                )}
                {audit.isLoading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {audit.data && audit.data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 text-sm">
              <div className="text-slate-500">
                Page {audit.data.page} of {audit.data.totalPages} · {audit.data.total} total
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
                  disabled={page >= audit.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

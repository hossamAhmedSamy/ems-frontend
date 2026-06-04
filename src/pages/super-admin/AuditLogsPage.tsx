import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/PageHeader';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { formatDateTime } from '../../lib/utils';

export default function AuditLogsPage() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const companyId = params.get('companyId') ?? '';
  const entityName = params.get('entityName') ?? '';

  const audit = useAuditLogs({
    page,
    pageSize: 50,
    companyId: companyId || undefined,
    entityName: entityName || undefined,
  });

  const updateFilter = (key: 'companyId' | 'entityName', value: string) => {
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
        description="Append-only event stream across every tenant. Filter by company id or entity name."
      />

      <div className="px-4 md:px-8 py-6 space-y-4 max-w-7xl mx-auto w-full">
        <Card className="p-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter by company id (e.g. co_…)"
                value={companyId}
                onChange={(e) => updateFilter('companyId', e.target.value)}
                className="pl-9 font-mono text-xs"
              />
            </div>
            <Input
              placeholder="Filter by entity (e.g. expense, branch, company)"
              value={entityName}
              onChange={(e) => updateFilter('entityName', e.target.value)}
            />
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
                    <td className="px-4 py-3 hidden lg:table-cell font-mono text-xs text-slate-500 truncate max-w-[12rem]">
                      {a.performedBy ?? '—'}
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

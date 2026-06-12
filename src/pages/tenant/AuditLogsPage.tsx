import { Fragment, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { SelectField } from '../../components/ui/Select';
import { Label } from '../../components/ui/Label';
import { PageHeader } from '../../components/PageHeader';
import { useTenantAuditLogs } from '../../hooks/useTenantAuditLogs';
import { useTenantMe } from '../../hooks/useTenantAuth';
import { useTenantUsers } from '../../hooks/useTenantUsers';
import { hasPermission } from '../../lib/permissions';
import {
  entityLabel,
  fieldChanges,
  formatAuditValue,
  prettyField,
  snapshotEntries,
} from '../../lib/audit';
import type { AuditLog } from '../../lib/types';
import { formatDateTime } from '../../lib/utils';

type ActionFilter = '' | 'Create' | 'Update' | 'Delete';

function AuditDetail({ log }: { log: AuditLog }) {
  const rows =
    log.action === 'Update'
      ? fieldChanges(log).map((c) => ({
          field: c.field,
          rendered: (
            <>
              <span className="text-slate-500 line-through">{formatAuditValue(c.from)}</span>
              <span className="mx-2 text-slate-400">→</span>
              <span className="text-slate-900">{formatAuditValue(c.to)}</span>
            </>
          ),
        }))
      : snapshotEntries(log).map((e) => ({
          field: e.field,
          rendered: <span className="text-slate-900">{formatAuditValue(e.value)}</span>,
        }));

  return (
    <div className="px-4 py-3 bg-surface-alt text-xs space-y-2">
      {rows.length > 0 ? (
        <dl className="grid gap-y-1.5 gap-x-4 sm:grid-cols-[auto_1fr]">
          {rows.map((r) => (
            <Fragment key={r.field}>
              <dt className="font-medium text-slate-600">{prettyField(r.field)}</dt>
              <dd className="break-words">{r.rendered}</dd>
            </Fragment>
          ))}
        </dl>
      ) : (
        <div className="text-slate-500">No field details were recorded for this event.</div>
      )}
      <div className="pt-2 border-t border-slate-200 text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
        <span>
          By <span className="text-slate-700">{log.performerName ?? 'System'}</span>
        </span>
        {log.ipAddress && <span>IP {log.ipAddress}</span>}
        <span className="font-mono">{log.entityId}</span>
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityName, setEntityName] = useState('');
  const [action, setAction] = useState<ActionFilter>('');
  const [performedBy, setPerformedBy] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const audit = useTenantAuditLogs({
    page,
    pageSize: 50,
    entityName: entityName || undefined,
    action: action || undefined,
    performedBy: performedBy || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to + 'T23:59:59.999Z').toISOString() : undefined,
  });

  // The "By" filter needs the user list; only offer it when the viewer may
  // list users. Display names come from the API itself (performerName).
  const me = useTenantMe();
  const canSeeUsers = hasPermission(me.data?.user, 'users:read');
  const users = useTenantUsers(canSeeUsers);

  const filter = (setter: (v: string) => void) => (v: string) => {
    setPage(1);
    setter(v);
  };

  return (
    <div>
      <PageHeader
        title="Audit"
        description="Append-only history of everything that changed in this workspace."
      />

      <div className="px-4 md:px-8 py-6 space-y-4 max-w-6xl mx-auto w-full">
        <Card className="p-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Entity</Label>
              <Input
                placeholder="expense, user, role, …"
                value={entityName}
                onChange={(e) => filter(setEntityName)(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Action</Label>
              <SelectField
                value={action || 'all'}
                onValueChange={(v) => filter((x) => setAction(x as ActionFilter))(v === 'all' ? '' : v)}
                options={[
                  { value: 'all', label: 'Any action' },
                  { value: 'Create', label: 'Create' },
                  { value: 'Update', label: 'Update' },
                  { value: 'Delete', label: 'Delete' },
                ]}
              />
            </div>
            {canSeeUsers && (
              <div>
                <Label className="text-xs">By</Label>
                <SelectField
                  value={performedBy || 'all'}
                  onValueChange={(v) => filter(setPerformedBy)(v === 'all' ? '' : v)}
                  options={[
                    { value: 'all', label: 'Anyone' },
                    ...(users.data?.items ?? []).map((u) => ({ value: u.id, label: u.fullName })),
                  ]}
                />
              </div>
            )}
            <div>
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={(e) => filter(setFrom)(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={(e) => filter(setTo)(e.target.value)} />
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
                  <th className="px-4 py-3 font-medium hidden md:table-cell">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit.data?.items.map((a) => (
                  <Fragment key={a.id}>
                    <tr
                      className="hover:bg-surface-alt cursor-pointer"
                      onClick={() => setExpandedId((cur) => (cur === a.id ? null : a.id))}
                    >
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
                        <div className="text-slate-900 truncate max-w-[16rem]">
                          {entityLabel(a) ?? (
                            <span className="font-mono text-xs text-slate-500">{a.entityId}</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{a.entityName.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-600 truncate max-w-[12rem]">
                        {a.performerName ?? (a.performedBy ? 'Removed user' : '—')}
                      </td>
                    </tr>
                    {expandedId === a.id && (
                      <tr>
                        <td colSpan={4} className="p-0">
                          <AuditDetail log={a} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {!audit.isLoading && (audit.data?.items.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
                      No events match your filters.
                    </td>
                  </tr>
                )}
                {audit.isLoading && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-500">
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

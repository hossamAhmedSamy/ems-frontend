import { useMemo, useState } from 'react';
import { Copy, Eye, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Modal } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { PageHeader } from '../../components/PageHeader';
import {
  useCreateRole,
  useDeleteRole,
  useRoles,
  useUpdateRole,
  type TenantRole,
} from '../../hooks/useTenantRoles';
import { ApiError } from '../../lib/api';
import { PERMISSION_GROUPS } from '../../lib/permissions';

type ModalState =
  | { mode: 'create'; source?: TenantRole }
  | { mode: 'edit'; role: TenantRole }
  | { mode: 'view'; role: TenantRole }
  | null;

export default function RolesPage() {
  const roles = useRoles();
  const deleteRole = useDeleteRole();
  const [modal, setModal] = useState<ModalState>(null);
  const [deleting, setDeleting] = useState<TenantRole | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRole.mutateAsync(deleting.id);
      setDeleting(null);
      setDeleteError(null);
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Network error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Roles"
        description="What each kind of teammate is allowed to do."
        actions={
          <Button onClick={() => setModal({ mode: 'create' })}>
            <Plus className="h-4 w-4" /> New role
          </Button>
        }
      />
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto w-full">
        <Card>
          {roles.isLoading ? (
            <p className="text-sm text-slate-500 p-6">Loading…</p>
          ) : (roles.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="h-5 w-5" />}
              title="No roles"
              description="System roles should appear here — try reloading."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Description</th>
                    <th className="px-4 py-3 font-medium">Permissions</th>
                    <th className="px-4 py-3 font-medium">Users</th>
                    <th className="px-4 py-3 font-medium w-px" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roles.data?.items.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-alt">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          {r.name}
                          {r.isSystem && <Badge tone="brand">System</Badge>}
                        </div>
                        {r.description && (
                          <div className="text-xs text-slate-500 md:hidden mt-0.5 max-w-[16rem]">
                            {r.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs text-slate-600 max-w-[22rem]">
                        {r.description ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.permissions.length}</td>
                      <td className="px-4 py-3 text-slate-700">{r.userCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setModal({ mode: 'create', source: r })}
                            aria-label={`Clone ${r.name}`}
                            title="Clone"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {r.isSystem ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setModal({ mode: 'view', role: r })}
                              aria-label={`View ${r.name}`}
                              title="View permissions"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setModal({ mode: 'edit', role: r })}
                                aria-label={`Edit ${r.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleting(r);
                                }}
                                aria-label={`Delete ${r.name}`}
                                disabled={r.userCount > 0}
                                title={
                                  r.userCount > 0
                                    ? 'Reassign its users first'
                                    : 'Delete role'
                                }
                              >
                                <Trash2 className="h-4 w-4 text-rose-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <p className="text-xs text-slate-500 mt-3">
          System roles are managed by EMS and can't be edited — clone one to make your own
          variant. Changes to a custom role apply to its users immediately.
        </p>
      </div>

      {modal !== null && <RoleModal state={modal} onClose={() => setModal(null)} />}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => {
          if (!o) {
            setDeleting(null);
            setDeleteError(null);
          }
        }}
        title={`Delete role ${deleting?.name ?? ''}?`}
        description={
          deleteError ??
          'This cannot be undone. Roles with assigned users cannot be deleted.'
        }
        confirmLabel="Delete role"
        destructive
        loading={deleteRole.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function RoleModal({ state, onClose }: { state: NonNullable<ModalState>; onClose: () => void }) {
  const readonly = state.mode === 'view';
  const editingRole = state.mode === 'edit' || state.mode === 'view' ? state.role : null;
  const source = state.mode === 'create' ? state.source : undefined;

  const create = useCreateRole();
  const update = useUpdateRole(editingRole?.id ?? '');

  const [name, setName] = useState(
    editingRole?.name ?? (source ? `${source.name} (copy)` : ''),
  );
  const [description, setDescription] = useState(
    editingRole?.description ?? source?.description ?? '',
  );
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(editingRole?.permissions ?? source?.permissions ?? []),
  );
  const [error, setError] = useState<string | null>(null);

  const allKeys = useMemo(
    () => PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key)),
    [],
  );

  const toggle = (key: string) => {
    if (readonly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleGroup = (keys: string[]) => {
    if (readonly) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const allOn = keys.every((k) => next.has(k));
      for (const k of keys) {
        if (allOn) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  };

  const onSubmit = async () => {
    if (readonly) return;
    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (selected.size === 0) {
      setError('Pick at least one permission');
      return;
    }
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        permissions: allKeys.filter((k) => selected.has(k)),
      };
      if (editingRole) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Network error');
    }
  };

  const title =
    state.mode === 'view'
      ? `${editingRole?.name} permissions`
      : state.mode === 'edit'
        ? `Edit ${editingRole?.name}`
        : source
          ? `New role from ${source.name}`
          : 'New role';

  return (
    <Modal
      open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={title}
      description={
        readonly
          ? 'System role — read-only. Clone it to make an editable variant.'
          : undefined
      }
      size="lg"
      footer={
        readonly ? (
          <Button variant="secondary" onClick={onClose} type="button">
            Close
          </Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button onClick={onSubmit} loading={create.isPending || update.isPending}>
              {editingRole ? 'Save changes' : 'Create role'}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        {!readonly && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. CFO"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this role is for"
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          {PERMISSION_GROUPS.map((group) => {
            const keys = group.items.map((i) => i.key);
            const onCount = keys.filter((k) => selected.has(k)).length;
            return (
              <div key={group.label} className="rounded-md border border-slate-200">
                <label className="flex items-center justify-between gap-2 px-3 py-2 bg-surface-alt rounded-t-md cursor-pointer">
                  <span className="text-sm font-medium text-slate-700">{group.label}</span>
                  {!readonly && (
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      {onCount}/{keys.length}
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={onCount === keys.length}
                        onChange={() => toggleGroup(keys)}
                      />
                    </span>
                  )}
                </label>
                <div className="grid sm:grid-cols-2">
                  {group.items.map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 px-3 py-2 text-sm ${
                        readonly ? '' : 'hover:bg-surface-alt cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selected.has(item.key)}
                        disabled={readonly}
                        onChange={() => toggle(item.key)}
                      />
                      <span className={selected.has(item.key) ? 'text-slate-900' : 'text-slate-500'}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Map, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Modal } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/PageHeader';
import {
  useCreateRegion,
  useDeleteRegion,
  useRegions,
  useUpdateRegion,
  type RegionInput,
} from '../../hooks/useTenantBranches';
import type { Region } from '../../lib/types';
import { ApiError } from '../../lib/api';
import { useTenantMe } from '../../hooks/useTenantAuth';
import { hasPermission } from '../../lib/permissions';

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  code: z.string().trim().max(50).optional().or(z.literal('')),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegionsPage() {
  const regions = useRegions();
  const me = useTenantMe();
  const user = me.data?.user;
  // Default-true while loading so cold-start doesn't hide buttons.
  const canManage = user ? hasPermission(user, 'regions:manage') : me.isLoading;
  const [editing, setEditing] = useState<Region | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Region | null>(null);
  const deleteRegion = useDeleteRegion();

  return (
    <div>
      <PageHeader
        title="Regions"
        description="Group branches by region. Optional but useful for reporting."
        actions={
          canManage ? (
            <Button onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              New region
            </Button>
          ) : undefined
        }
      />
      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        <Card>
          {regions.isLoading ? (
            <p className="text-sm text-slate-500 p-6">Loading…</p>
          ) : (regions.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Map className="h-5 w-5" />}
              title="No regions yet"
              description={
                canManage
                  ? 'Create regions to group branches geographically.'
                  : 'No regions set up. Ask your Admin to add the first one.'
              }
              action={
                canManage ? (
                  <Button onClick={() => setEditing('new')}>
                    <Plus className="h-4 w-4" /> Add region
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Code</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium w-px" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regions.data?.items.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-alt">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{r.name}</div>
                        {r.description && (
                          <div className="text-xs text-slate-500 line-clamp-1">{r.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-700 font-mono text-xs">
                        {r.code ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={r.isActive ? 'success' : 'neutral'}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {canManage && (
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditing(r)}
                              aria-label="Edit region"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleting(r)}
                              aria-label="Delete region"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {editing !== null && (
        <RegionFormModal editing={editing} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This cannot be undone. Branches in this region will keep their data; their region link will be cleared."
        confirmLabel="Delete region"
        destructive
        loading={deleteRegion.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteRegion.mutateAsync(deleting.id);
            setDeleting(null);
          } catch (err) {
            // Error swallowed for now; toast layer comes in v0.3.1
            console.error(err);
          }
        }}
      />
    </div>
  );
}

function RegionFormModal({
  editing,
  onClose,
}: {
  editing: Region | 'new';
  onClose: () => void;
}) {
  const isNew = editing === 'new';
  const region = editing === 'new' ? null : editing;
  const createRegion = useCreateRegion();
  const updateRegion = useUpdateRegion(region?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: region
      ? {
          name: region.name,
          code: region.code ?? '',
          description: region.description ?? '',
          sortOrder: region.sortOrder,
        }
      : { name: '', code: '', description: '', sortOrder: 0 },
  });

  const onSubmit = handleSubmit(async (v) => {
    const input: RegionInput = {
      name: v.name,
      code: v.code || null,
      description: v.description || null,
      sortOrder: v.sortOrder ?? 0,
    };
    try {
      if (region) await updateRegion.mutateAsync(input);
      else await createRegion.mutateAsync(input);
      reset();
      onClose();
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Network error' });
    }
  });

  return (
    <Modal
      open
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
      title={isNew ? 'New region' : `Edit ${region?.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={createRegion.isPending || updateRegion.isPending}>
            {isNew ? 'Create region' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} placeholder="Cairo" autoFocus />
          {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Code (optional)</Label>
            <Input {...register('code')} placeholder="CAI" />
          </div>
          <div className="space-y-1.5">
            <Label>Sort order</Label>
            <Input type="number" {...register('sortOrder')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description (optional)</Label>
          <Input {...register('description')} placeholder="Greater Cairo metropolitan area" />
        </div>
        {errors.root && (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {errors.root.message}
          </div>
        )}
      </form>
    </Modal>
  );
}

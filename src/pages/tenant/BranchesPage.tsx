import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { SelectField } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Dialog';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/PageHeader';
import {
  useBranches,
  useCreateBranch,
  useDeleteBranch,
  useRegions,
  useUpdateBranch,
  type BranchInput,
} from '../../hooks/useTenantBranches';
import type { Branch } from '../../lib/types';
import { ApiError } from '../../lib/api';

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  code: z.string().trim().max(50).optional().or(z.literal('')),
  regionId: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export default function BranchesPage() {
  const branches = useBranches();
  const regions = useRegions();
  const [editing, setEditing] = useState<Branch | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Branch | null>(null);
  const deleteBranch = useDeleteBranch();

  const regionById = new Map((regions.data?.items ?? []).map((r) => [r.id, r]));

  return (
    <div>
      <PageHeader
        title="Branches"
        description="Locations where your company records expenses."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            New branch
          </Button>
        }
      />
      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        <Card>
          {branches.isLoading ? (
            <p className="text-sm text-slate-500 p-6">Loading…</p>
          ) : (branches.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Building2 className="h-5 w-5" />}
              title="No branches yet"
              description="Branches are where expenses get recorded. Add your first."
              action={
                <Button onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" /> Add branch
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Code</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Region</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium w-px" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {branches.data?.items.map((b) => (
                    <tr key={b.id} className="hover:bg-surface-alt">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-md bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="font-medium text-slate-900">{b.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-700 font-mono text-xs">
                        {b.code ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                        {b.regionId ? regionById.get(b.regionId)?.name ?? '—' : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={b.isActive ? 'success' : 'neutral'}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(b)}
                            aria-label="Edit branch"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(b)}
                            aria-label="Delete branch"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <BranchFormModal editing={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="The branch is soft-deleted. Existing expenses against it remain; you won't be able to record new ones."
        confirmLabel="Delete branch"
        destructive
        loading={deleteBranch.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteBranch.mutateAsync(deleting.id);
            setDeleting(null);
          } catch (err) {
            console.error(err);
          }
        }}
      />
    </div>
  );
}

function BranchFormModal({
  editing,
  onClose,
}: {
  editing: Branch | 'new' | null;
  onClose: () => void;
}) {
  const isOpen = editing !== null;
  const isNew = editing === 'new';
  const branch = editing === 'new' ? null : editing;
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch(branch?.id ?? '');
  const regions = useRegions();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: branch
      ? { name: branch.name, code: branch.code ?? '', regionId: branch.regionId ?? '' }
      : { name: '', code: '', regionId: '' },
  });
  const regionId = watch('regionId');

  const onSubmit = handleSubmit(async (v) => {
    const input: BranchInput = {
      name: v.name,
      code: v.code || null,
      regionId: v.regionId || null,
    };
    try {
      if (branch) await updateBranch.mutateAsync(input);
      else await createBranch.mutateAsync(input);
      reset();
      onClose();
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Network error' });
    }
  });

  const regionOptions = [
    { value: 'none', label: '— none —' },
    ...(regions.data?.items ?? []).map((r) => ({ value: r.id, label: r.name })),
  ];

  return (
    <Modal
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
      title={isNew ? 'New branch' : `Edit ${branch?.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={createBranch.isPending || updateBranch.isPending}>
            {isNew ? 'Create branch' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} placeholder="Maadi Warehouse" autoFocus />
          {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Code (optional)</Label>
            <Input {...register('code')} placeholder="MAA01" />
          </div>
          <div className="space-y-1.5">
            <Label>Region (optional)</Label>
            <SelectField
              value={regionId || 'none'}
              onValueChange={(v) => setValue('regionId', v === 'none' ? '' : v)}
              options={regionOptions}
            />
          </div>
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

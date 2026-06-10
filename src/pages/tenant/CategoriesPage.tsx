import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';
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
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
  type CategoryInput,
  type ExpenseCategory,
} from '../../hooks/useTenantCategories';
import { useTenantMe } from '../../hooks/useTenantAuth';
import { hasPermission } from '../../lib/permissions';
import { ApiError } from '../../lib/api';

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CategoriesPage() {
  const cats = useCategories();
  const me = useTenantMe();
  const role = me.data?.user?.role;
  const canManage = role ? hasPermission(role, 'expense-categories:manage') : me.isLoading;
  const [editing, setEditing] = useState<ExpenseCategory | 'new' | null>(null);
  const [deleting, setDeleting] = useState<ExpenseCategory | null>(null);
  const deleteCat = useDeleteCategory();

  return (
    <div>
      <PageHeader
        title="Expense categories"
        description={
          canManage
            ? 'Categories you can use when recording expenses (e.g. Utilities, Rent, Supplies).'
            : 'Categories available for expense entry. Ask your Admin to add new ones.'
        }
        actions={
          canManage ? (
            <Button onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" />
              New category
            </Button>
          ) : undefined
        }
      />
      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        <Card>
          {cats.isLoading ? (
            <p className="text-sm text-slate-500 p-6">Loading…</p>
          ) : (cats.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<FolderTree className="h-5 w-5" />}
              title="No categories yet"
              description={
                canManage
                  ? 'Categories let you group expenses for reports and budgeting.'
                  : 'No categories have been set up. Ask your Admin to add them.'
              }
              action={
                canManage ? (
                  <Button onClick={() => setEditing('new')}>
                    <Plus className="h-4 w-4" /> Add category
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
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Description</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium w-px" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cats.data?.items.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-alt">
                      <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                        {c.description ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={c.isActive ? 'success' : 'neutral'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {canManage && (
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditing(c)}
                              aria-label="Edit category"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleting(c)}
                              aria-label="Delete category"
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
        <CategoryFormModal editing={editing} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete "${deleting?.name}"?`}
        description="This will fail if any expenses are linked to this category. Deactivate it first if you can't delete."
        confirmLabel="Delete category"
        destructive
        loading={deleteCat.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteCat.mutateAsync(deleting.id);
            setDeleting(null);
          } catch (err) {
            console.error(err);
          }
        }}
      />
    </div>
  );
}

function CategoryFormModal({
  editing,
  onClose,
}: {
  editing: ExpenseCategory | 'new';
  onClose: () => void;
}) {
  const isNew = editing === 'new';
  const cat = editing === 'new' ? null : editing;
  const create = useCreateCategory();
  const update = useUpdateCategory(cat?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: cat
      ? { name: cat.name, description: cat.description ?? '', sortOrder: cat.sortOrder }
      : { name: '', description: '', sortOrder: 0 },
  });

  const onSubmit = handleSubmit(async (v) => {
    const input: CategoryInput = {
      name: v.name,
      description: v.description || null,
      sortOrder: v.sortOrder ?? 0,
    };
    try {
      if (cat) await update.mutateAsync(input);
      else await create.mutateAsync(input);
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
      title={isNew ? 'New category' : `Edit ${cat?.name}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={create.isPending || update.isPending}>
            {isNew ? 'Create category' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} placeholder="Utilities" autoFocus />
          {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Sort order</Label>
            <Input type="number" {...register('sortOrder')} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description (optional)</Label>
          <Input {...register('description')} placeholder="Electricity, water, internet, …" />
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

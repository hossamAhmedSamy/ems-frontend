import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
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
  useCreateExpense,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
  type CreateExpenseInput,
  type Expense,
  type ExpenseStatus,
} from '../../hooks/useTenantExpenses';
import { useBranches } from '../../hooks/useTenantBranches';
import { useCategories } from '../../hooks/useTenantCategories';
import { ApiError } from '../../lib/api';
import { formatDateTime, formatMoney } from '../../lib/utils';

const STATUS_TONE: Record<ExpenseStatus, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  Approved: 'success',
  Submitted: 'info',
  Draft: 'neutral',
  Rejected: 'danger',
};

export default function ExpensesPage() {
  const branches = useBranches();
  const categories = useCategories();
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const expenses = useExpenses({
    page,
    pageSize: 25,
    branchId: filterBranch || undefined,
    categoryId: filterCategory || undefined,
  });
  const [editing, setEditing] = useState<Expense | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const deleteExp = useDeleteExpense();

  const branchById = new Map((branches.data?.items ?? []).map((b) => [b.id, b]));
  const categoryById = new Map((categories.data?.items ?? []).map((c) => [c.id, c]));

  const hasNoSetup =
    (branches.data?.items.length ?? 0) === 0 || (categories.data?.items.length ?? 0) === 0;

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="All recorded spending across your branches."
        actions={
          <Button onClick={() => setEditing('new')} disabled={hasNoSetup}>
            <Plus className="h-4 w-4" /> New expense
          </Button>
        }
      />
      <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto w-full space-y-4">
        {hasNoSetup && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-900">
              You need at least one <strong>branch</strong> and one <strong>expense category</strong>{' '}
              before you can record expenses.
            </p>
          </Card>
        )}

        <Card className="p-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Branch</Label>
              <SelectField
                value={filterBranch || 'all'}
                onValueChange={(v) => {
                  setPage(1);
                  setFilterBranch(v === 'all' ? '' : v);
                }}
                options={[
                  { value: 'all', label: 'All branches' },
                  ...(branches.data?.items ?? []).map((b) => ({ value: b.id, label: b.name })),
                ]}
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <SelectField
                value={filterCategory || 'all'}
                onValueChange={(v) => {
                  setPage(1);
                  setFilterCategory(v === 'all' ? '' : v);
                }}
                options={[
                  { value: 'all', label: 'All categories' },
                  ...(categories.data?.items ?? []).map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>
          </div>
        </Card>

        <Card>
          {expenses.isLoading ? (
            <p className="text-sm text-slate-500 p-6">Loading…</p>
          ) : (expenses.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Receipt className="h-5 w-5" />}
              title="No expenses yet"
              description={
                hasNoSetup
                  ? 'Add a branch and a category first, then record your first expense.'
                  : 'Click "New expense" to record your first spending.'
              }
              action={
                !hasNoSetup ? (
                  <Button onClick={() => setEditing('new')}>
                    <Plus className="h-4 w-4" /> New expense
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Branch</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium w-px" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenses.data?.items.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-alt">
                      <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                        {formatDateTime(e.expenseDate).split(',')[0]}
                      </td>
                      <td className="px-4 py-3 text-slate-900">
                        <div className="font-medium line-clamp-1">{e.description}</div>
                        {e.referenceNumber && (
                          <div className="text-xs text-slate-500 font-mono">
                            #{e.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                        {branchById.get(e.branchId)?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                        {categoryById.get(e.categoryId)?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900 whitespace-nowrap">
                        {formatMoney(e.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(e)}
                            aria-label="Edit expense"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleting(e)}
                            aria-label="Delete expense"
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

          {expenses.data && expenses.data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-200 text-sm">
              <div className="text-slate-500">
                Page {expenses.data.page} of {expenses.data.totalPages} ·{' '}
                {expenses.data.total} total
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
                  disabled={page >= expenses.data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {editing !== null && (
        <ExpenseFormModal editing={editing} onClose={() => setEditing(null)} />
      )}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete expense?"
        description={deleting ? `${formatMoney(deleting.amount)} · ${deleting.description}` : ''}
        confirmLabel="Delete"
        destructive
        loading={deleteExp.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteExp.mutateAsync(deleting.id);
            setDeleting(null);
          } catch (err) {
            console.error(err);
          }
        }}
      />
    </div>
  );
}

const schema = z.object({
  branchId: z.string().min(1, 'Pick a branch'),
  categoryId: z.string().min(1, 'Pick a category'),
  amount: z.coerce.number().positive('Must be positive'),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  description: z.string().trim().min(1, 'Required').max(2000),
  notes: z.string().trim().max(5000).optional().or(z.literal('')),
  referenceNumber: z.string().trim().max(100).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function ExpenseFormModal({
  editing,
  onClose,
}: {
  editing: Expense | 'new';
  onClose: () => void;
}) {
  const isNew = editing === 'new';
  const expense = editing === 'new' ? null : editing;
  const branches = useBranches();
  const categories = useCategories();
  const create = useCreateExpense();
  const update = useUpdateExpense(expense?.id ?? '');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: expense
      ? {
          branchId: expense.branchId,
          categoryId: expense.categoryId,
          amount: parseFloat(expense.amount),
          expenseDate: expense.expenseDate.slice(0, 10),
          description: expense.description,
          notes: expense.notes ?? '',
          referenceNumber: expense.referenceNumber ?? '',
        }
      : {
          branchId: '',
          categoryId: '',
          amount: 0,
          expenseDate: todayIso(),
          description: '',
          notes: '',
          referenceNumber: '',
        },
  });

  const branchId = watch('branchId');
  const categoryId = watch('categoryId');

  const onSubmit = handleSubmit(async (v) => {
    const input: CreateExpenseInput = {
      branchId: v.branchId,
      categoryId: v.categoryId,
      amount: v.amount,
      expenseDate: v.expenseDate,
      description: v.description,
      notes: v.notes || null,
      referenceNumber: v.referenceNumber || null,
    };
    try {
      if (expense) await update.mutateAsync(input);
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
      title={isNew ? 'New expense' : 'Edit expense'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={create.isPending || update.isPending}>
            {isNew ? 'Record expense' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Branch</Label>
            <SelectField
              value={branchId || undefined}
              onValueChange={(v) => setValue('branchId', v)}
              placeholder="Select a branch"
              options={(branches.data?.items ?? []).map((b) => ({
                value: b.id,
                label: b.name,
              }))}
            />
            {errors.branchId && (
              <p className="text-xs text-rose-600">{errors.branchId.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <SelectField
              value={categoryId || undefined}
              onValueChange={(v) => setValue('categoryId', v)}
              placeholder="Select a category"
              options={(categories.data?.items ?? []).map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
            {errors.categoryId && (
              <p className="text-xs text-rose-600">{errors.categoryId.message}</p>
            )}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" step="0.01" min="0" {...register('amount')} />
            {errors.amount && <p className="text-xs text-rose-600">{errors.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" {...register('expenseDate')} />
            {errors.expenseDate && (
              <p className="text-xs text-rose-600">{errors.expenseDate.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input {...register('description')} placeholder="Electricity bill for September" />
          {errors.description && (
            <p className="text-xs text-rose-600">{errors.description.message}</p>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Reference (optional)</Label>
            <Input {...register('referenceNumber')} placeholder="Invoice #" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Notes (optional)</Label>
          <Input {...register('notes')} placeholder="Any extra context" />
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

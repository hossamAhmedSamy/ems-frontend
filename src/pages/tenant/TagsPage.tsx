import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil, Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
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
  useCreateTag,
  useDeleteTag,
  useTags,
  useUpdateTag,
  type Tag,
  type TagInput,
} from '../../hooks/useTenantCategories';
import { useTenantMe } from '../../hooks/useTenantAuth';
import { hasPermission } from '../../lib/permissions';
import { ApiError } from '../../lib/api';

const HEX_RX = /^#[0-9a-fA-F]{6}$/;
const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(100),
  color: z
    .string()
    .trim()
    .regex(HEX_RX, 'Use #RRGGBB')
    .optional()
    .or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;

export default function TagsPage() {
  const tags = useTags();
  const me = useTenantMe();
  const role = me.data?.user?.role;
  const canManage = role ? hasPermission(role, 'tags:manage') : false;
  const [editing, setEditing] = useState<Tag | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Tag | null>(null);
  const deleteTag = useDeleteTag();

  return (
    <div>
      <PageHeader
        title="Tags"
        description="Reusable labels you can attach to expenses or promotions."
        actions={
          canManage ? (
            <Button onClick={() => setEditing('new')}>
              <Plus className="h-4 w-4" /> New tag
            </Button>
          ) : undefined
        }
      />
      <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        <Card>
          {tags.isLoading ? (
            <p className="text-sm text-slate-500 p-6">Loading…</p>
          ) : (tags.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<TagIcon className="h-5 w-5" />}
              title="No tags yet"
              description={
                canManage
                  ? "Use tags to mark expenses for ad-hoc grouping (e.g. 'reimbursable', 'project-X')."
                  : 'No tags set up. Ask your Admin to add the first one.'
              }
              action={
                canManage ? (
                  <Button onClick={() => setEditing('new')}>
                    <Plus className="h-4 w-4" /> Add tag
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {tags.data?.items.map((t) => (
                <li key={t.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-6 w-6 rounded-md flex-shrink-0 border border-slate-200"
                      style={{ background: t.color ?? 'transparent' }}
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-slate-900 truncate">{t.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{t.color ?? 'no color'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge tone={t.isActive ? 'success' : 'neutral'}>
                      {t.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {canManage && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(t)}
                          aria-label="Edit tag"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting(t)}
                          aria-label="Delete tag"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <TagFormModal editing={editing} onClose={() => setEditing(null)} />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete tag "${deleting?.name}"?`}
        description="This will untag any expenses or promotions currently using it."
        confirmLabel="Delete tag"
        destructive
        loading={deleteTag.isPending}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await deleteTag.mutateAsync(deleting.id);
            setDeleting(null);
          } catch (err) {
            console.error(err);
          }
        }}
      />
    </div>
  );
}

function TagFormModal({
  editing,
  onClose,
}: {
  editing: Tag | 'new' | null;
  onClose: () => void;
}) {
  const isOpen = editing !== null;
  const isNew = editing === 'new';
  const tag = editing === 'new' ? null : editing;
  const create = useCreateTag();
  const update = useUpdateTag(tag?.id ?? '');

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
    values: tag ? { name: tag.name, color: tag.color ?? '' } : { name: '', color: '#4F46E5' },
  });

  // Controlled color: two inputs (picker + text) bound to ONE source of truth
  // via watch/setValue. The previous code registered both inputs to the same
  // field via {...register('color')} — react-hook-form sees the last one's
  // value, so the picker's onChange was effectively ignored.
  const color = watch('color') ?? '';

  const onSubmit = handleSubmit(async (v) => {
    const input: TagInput = { name: v.name, color: v.color || null };
    try {
      if (tag) await update.mutateAsync(input);
      else await create.mutateAsync(input);
      reset();
      onClose();
    } catch (err) {
      setError('root', { message: err instanceof ApiError ? err.message : 'Network error' });
    }
  });

  return (
    <Modal
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) {
          reset();
          onClose();
        }
      }}
      title={isNew ? 'New tag' : `Edit ${tag?.name}`}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={create.isPending || update.isPending}>
            {isNew ? 'Create tag' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input {...register('name')} placeholder="reimbursable" autoFocus />
          {errors.name && <p className="text-xs text-rose-600">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              className="w-14 h-10 p-1"
              value={color || '#4F46E5'}
              onChange={(e) => setValue('color', e.target.value, { shouldDirty: true })}
            />
            <Input
              value={color}
              onChange={(e) => setValue('color', e.target.value, { shouldDirty: true })}
              placeholder="#4F46E5"
              className="font-mono"
            />
          </div>
          {errors.color && <p className="text-xs text-rose-600">{errors.color.message}</p>}
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

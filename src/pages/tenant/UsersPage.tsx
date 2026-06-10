import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  CheckCircle2,
  CircleSlash,
  KeyRound,
  Pencil,
  Plus,
  Users as UsersIcon,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { SelectField } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Dialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { PageHeader } from '../../components/PageHeader';
import {
  useCreateTenantUser,
  useResetUserPassword,
  useSetUserBranchAccess,
  useTenantUsers,
  useUpdateTenantUser,
  type TenantUserDetail,
} from '../../hooks/useTenantUsers';
import { useBranches } from '../../hooks/useTenantBranches';
import { useTenantMe } from '../../hooks/useTenantAuth';
import { ApiError } from '../../lib/api';
import type { TenantUser } from '../../lib/types';

const ROLE_OPTIONS: { value: TenantUser['role']; label: string }[] = [
  { value: 'Admin', label: 'Admin — full access' },
  { value: 'CEO', label: 'CEO — full visibility, all branches' },
  { value: 'BranchManager', label: 'Branch Manager — assigned branches only' },
  { value: 'DataEntry', label: 'Data Entry — record expenses' },
  { value: 'Finance', label: 'Finance — view + approve all branches' },
];

export default function UsersPage() {
  const users = useTenantUsers();
  const me = useTenantMe();
  const [editing, setEditing] = useState<TenantUserDetail | 'new' | null>(null);
  const [resetting, setResetting] = useState<TenantUserDetail | null>(null);

  return (
    <div>
      <PageHeader
        title="Users"
        description="People with access to this workspace."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> Add user
          </Button>
        }
      />
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto w-full">
        <Card>
          {users.isLoading ? (
            <p className="text-sm text-slate-500 p-6">Loading…</p>
          ) : (users.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<UsersIcon className="h-5 w-5" />}
              title="Only you so far"
              description="Add team members to delegate work. They don't need an email — just a username and password."
              action={
                <Button onClick={() => setEditing('new')}>
                  <Plus className="h-4 w-4" /> Add user
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Branches</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium w-px" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.data?.items.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-alt">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {u.fullName}
                          {u.id === me.data?.user?.id && (
                            <span className="ml-2 text-xs text-slate-400">(you)</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                        {u.email && <div className="text-xs text-slate-500">{u.email}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          tone={
                            u.role === 'Admin' || u.role === 'CEO' ? 'brand' : 'neutral'
                          }
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-600">
                        {u.branchAssignments.length === 0
                          ? 'all branches'
                          : `${u.branchAssignments.length} branch${u.branchAssignments.length === 1 ? '' : 'es'}`}
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                            <CircleSlash className="h-3 w-3" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setResetting(u)}
                            aria-label="Reset password"
                            title="Reset password"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(u)}
                            aria-label="Edit user"
                          >
                            <Pencil className="h-4 w-4" />
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

      {editing !== null && (
        <UserFormModal editing={editing} onClose={() => setEditing(null)} />
      )}
      {resetting !== null && (
        <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
      )}
    </div>
  );
}

const createSchema = z.object({
  fullName: z.string().trim().min(1, 'Required').max(200),
  username: z.string().trim().min(3, 'Min 3 chars').max(80).regex(/^[a-zA-Z0-9._-]+$/, 'Letters, numbers, . _ -'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8, 'Min 8 chars').max(200),
  role: z.enum(['Admin', 'CEO', 'BranchManager', 'DataEntry', 'Finance']),
  branchAssignments: z.array(z.string()).optional(),
});

const updateSchema = z.object({
  fullName: z.string().trim().min(1, 'Required').max(200),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['Admin', 'CEO', 'BranchManager', 'DataEntry', 'Finance']),
  isActive: z.boolean(),
  branchAssignments: z.array(z.string()).optional(),
});

type CreateForm = z.infer<typeof createSchema>;
type UpdateForm = z.infer<typeof updateSchema>;

function UserFormModal({
  editing,
  onClose,
}: {
  editing: TenantUserDetail | 'new';
  onClose: () => void;
}) {
  const isNew = editing === 'new';
  const user = editing === 'new' ? null : editing;
  const create = useCreateTenantUser();
  const update = useUpdateTenantUser(user?.id ?? '');
  const setBranchAccess = useSetUserBranchAccess(user?.id ?? '');
  const branches = useBranches();

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'DataEntry', branchAssignments: [] },
  });
  const updateForm = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    values: user
      ? {
          fullName: user.fullName,
          email: user.email ?? '',
          role: user.role,
          isActive: user.isActive,
          branchAssignments: user.branchAssignments,
        }
      : undefined,
  });

  // The two forms have different shapes — keep them entirely separate to avoid
  // type gymnastics. Pick reactive values from the active form via a small
  // adapter so the JSX below stays one tree.
  const role = (isNew ? createForm.watch('role') : updateForm.watch('role')) as TenantUser['role'] | undefined;
  const branchAssignments =
    (isNew
      ? createForm.watch('branchAssignments')
      : updateForm.watch('branchAssignments')) ?? [];
  const branchScopeRelevant = role === 'BranchManager' || role === 'DataEntry';

  const toggleBranch = (id: string) => {
    const next = branchAssignments.includes(id)
      ? branchAssignments.filter((b) => b !== id)
      : [...branchAssignments, id];
    if (isNew) createForm.setValue('branchAssignments', next);
    else updateForm.setValue('branchAssignments', next);
  };

  const setRole = (v: TenantUser['role']) => {
    if (isNew) createForm.setValue('role', v);
    else updateForm.setValue('role', v);
  };

  const setRootError = (message: string) => {
    if (isNew) createForm.setError('root', { message });
    else updateForm.setError('root', { message });
  };

  const rootError = isNew
    ? createForm.formState.errors.root?.message
    : updateForm.formState.errors.root?.message;

  const onSubmit = async () => {
    try {
      if (isNew) {
        const values = createForm.getValues();
        const created = await create.mutateAsync({
          fullName: values.fullName,
          username: values.username,
          email: values.email || null,
          password: values.password,
          role: values.role,
          branchAssignments: values.branchAssignments,
        });
        if (values.branchAssignments?.length) {
          await setBranchAccess.mutateAsync(values.branchAssignments);
        }
        void created;
      } else if (user) {
        const values = updateForm.getValues();
        await update.mutateAsync({
          fullName: values.fullName,
          email: values.email || null,
          role: values.role,
          isActive: values.isActive,
        });
        const before = new Set(user.branchAssignments);
        const after = new Set(values.branchAssignments ?? []);
        const changed = before.size !== after.size || [...before].some((b) => !after.has(b));
        if (changed) await setBranchAccess.mutateAsync(values.branchAssignments ?? []);
      }
      createForm.reset();
      onClose();
    } catch (err) {
      setRootError(err instanceof ApiError ? err.message : 'Network error');
    }
  };

  const handleSubmit = isNew
    ? createForm.handleSubmit(onSubmit)
    : updateForm.handleSubmit(onSubmit);

  return (
    <Modal
      open
      onOpenChange={(o) => {
        if (!o) {
          createForm.reset();
          onClose();
        }
      }}
      title={isNew ? 'Add user' : `Edit ${user?.fullName}`}
      description={
        isNew
          ? 'Employees don\'t need an email address; just a username and password.'
          : undefined
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={create.isPending || update.isPending}>
            {isNew ? 'Create user' : 'Save changes'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input
              {...(isNew ? createForm.register('fullName') : updateForm.register('fullName'))}
              placeholder="Jane Doe"
              autoFocus
            />
            {(isNew ? createForm.formState.errors.fullName : updateForm.formState.errors.fullName) && (
              <p className="text-xs text-rose-600">
                {String((isNew ? createForm : updateForm).formState.errors.fullName?.message)}
              </p>
            )}
          </div>
          {isNew ? (
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input {...createForm.register('username')} placeholder="jane.doe" />
              {createForm.formState.errors.username && (
                <p className="text-xs text-rose-600">
                  {createForm.formState.errors.username.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={`@${user?.username}`} disabled className="font-mono" />
            </div>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Email (optional)</Label>
            <Input
              {...(isNew ? createForm.register('email') : updateForm.register('email'))}
              type="email"
              placeholder="jane@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <SelectField
              value={role}
              onValueChange={(v) => setRole(v as TenantUser['role'])}
              options={ROLE_OPTIONS}
            />
          </div>
        </div>
        {isNew && (
          <div className="space-y-1.5">
            <Label>Initial password</Label>
            <Input
              type="text"
              {...createForm.register('password')}
              placeholder="At least 8 characters"
            />
            {createForm.formState.errors.password && (
              <p className="text-xs text-rose-600">
                {createForm.formState.errors.password.message}
              </p>
            )}
            <p className="text-xs text-slate-500">
              The user will be asked to change this on first sign-in.
            </p>
          </div>
        )}
        {!isNew && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              className="rounded"
              {...updateForm.register('isActive')}
            />
            <Label htmlFor="isActive" className="!font-normal cursor-pointer">
              Account is active
            </Label>
          </div>
        )}
        {branchScopeRelevant && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <Label>
              Branches this user can access
              <span className="text-xs text-slate-400 font-normal"> — leave empty for none</span>
            </Label>
            <div className="rounded-md border border-slate-200 max-h-40 overflow-auto">
              {(branches.data?.items ?? []).map((b) => (
                <label
                  key={b.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-surface-alt cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={branchAssignments.includes(b.id)}
                    onChange={() => toggleBranch(b.id)}
                  />
                  <Building2 className="h-3 w-3 text-slate-400" />
                  <span>{b.name}</span>
                </label>
              ))}
              {(branches.data?.items.length ?? 0) === 0 && (
                <p className="text-xs text-slate-500 p-3">
                  No branches yet — create branches first, then come back.
                </p>
              )}
            </div>
          </div>
        )}
        {rootError && (
          <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            {String(rootError)}
          </div>
        )}
      </form>
    </Modal>
  );
}

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Min 8 chars').max(200),
});
type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordModal({
  user,
  onClose,
}: {
  user: TenantUserDetail;
  onClose: () => void;
}) {
  const reset = useResetUserPassword(user?.id ?? '');
  const {
    register,
    handleSubmit,
    reset: resetForm,
    setError,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await reset.mutateAsync(v.newPassword);
      resetForm();
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
          resetForm();
          onClose();
        }
      }}
      title={`Reset password for ${user?.fullName}`}
      description="They'll be signed out everywhere and required to change it on next sign-in."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={reset.isPending}>
            Reset password
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input
            type="text"
            autoFocus
            {...register('newPassword')}
            placeholder="At least 8 characters"
          />
          {errors.newPassword && (
            <p className="text-xs text-rose-600">{errors.newPassword.message}</p>
          )}
          <p className="text-xs text-slate-500">
            Communicate this new password to the user securely (in person, on Slack, etc).
          </p>
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

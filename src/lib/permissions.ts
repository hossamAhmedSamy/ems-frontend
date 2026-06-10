// Permissions are resolved by the backend and arrive on the session user via
// /auth/me (and login/handoff). The UI only checks membership — there is no
// client-side role → permission matrix anymore, so the two sides can't drift.
// The key list mirrors ems-backend/src/core/permissions.ts; keep in sync when
// the registry grows.

export type Permission =
  | 'company:read'
  | 'company:update'
  | 'billing:read'
  | 'billing:manage'
  | 'users:read'
  | 'users:manage'
  | 'roles:manage'
  | 'branches:read'
  | 'branches:manage'
  | 'branches:all-access'
  | 'regions:manage'
  | 'expense-categories:manage'
  | 'expenses:read'
  | 'expenses:create'
  | 'expenses:update'
  | 'expenses:delete'
  | 'expenses:approve'
  | 'promotion-types:manage'
  | 'clients:manage'
  | 'promotions:read'
  | 'promotions:create'
  | 'promotions:update'
  | 'promotions:delete'
  | 'tags:manage'
  | 'audit:read';

export interface PermissionHolder {
  permissions?: string[] | null;
}

export function hasPermission(
  user: PermissionHolder | null | undefined,
  permission: Permission,
): boolean {
  return !!user?.permissions?.includes(permission);
}

// Grouping + human labels for the role editor's permission picker.
export const PERMISSION_GROUPS: {
  label: string;
  items: { key: Permission; label: string }[];
}[] = [
  {
    label: 'Company & billing',
    items: [
      { key: 'company:read', label: 'View company info' },
      { key: 'company:update', label: 'Edit company settings' },
      { key: 'billing:read', label: 'View billing & subscription' },
      { key: 'billing:manage', label: 'Manage billing & subscription' },
    ],
  },
  {
    label: 'Users & roles',
    items: [
      { key: 'users:read', label: 'View users' },
      { key: 'users:manage', label: 'Create, edit & deactivate users' },
      { key: 'roles:manage', label: 'Create & edit roles' },
    ],
  },
  {
    label: 'Branches & regions',
    items: [
      { key: 'branches:read', label: 'View branches' },
      { key: 'branches:manage', label: 'Create & edit branches' },
      { key: 'branches:all-access', label: 'See data for all branches' },
      { key: 'regions:manage', label: 'Manage regions' },
    ],
  },
  {
    label: 'Expenses',
    items: [
      { key: 'expenses:read', label: 'View expenses' },
      { key: 'expenses:create', label: 'Record expenses' },
      { key: 'expenses:update', label: 'Edit expenses' },
      { key: 'expenses:delete', label: 'Delete expenses' },
      { key: 'expenses:approve', label: 'Approve expenses' },
      { key: 'expense-categories:manage', label: 'Manage expense categories' },
    ],
  },
  {
    label: 'Promotions & clients',
    items: [
      { key: 'promotions:read', label: 'View promotions' },
      { key: 'promotions:create', label: 'Create promotions' },
      { key: 'promotions:update', label: 'Edit promotions' },
      { key: 'promotions:delete', label: 'Delete promotions' },
      { key: 'promotion-types:manage', label: 'Manage promotion types' },
      { key: 'clients:manage', label: 'Manage clients' },
    ],
  },
  {
    label: 'Tags & audit',
    items: [
      { key: 'tags:manage', label: 'Manage tags' },
      { key: 'audit:read', label: 'View audit history' },
    ],
  },
];

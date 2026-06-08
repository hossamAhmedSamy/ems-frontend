// Mirror of the backend role/permission matrix so the UI can hide nav items
// and gate actions without a server roundtrip. The backend is still the only
// source of truth — every action is re-checked there.

import type { TenantUser } from './types';

export type Permission =
  | 'company:read'
  | 'company:update'
  | 'billing:read'
  | 'billing:manage'
  | 'users:read'
  | 'users:manage'
  | 'branches:read'
  | 'branches:manage'
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

type Role = TenantUser['role'];

const ALL: ReadonlySet<Permission> = new Set<Permission>([
  'company:read', 'company:update',
  'billing:read', 'billing:manage',
  'users:read', 'users:manage',
  'branches:read', 'branches:manage', 'regions:manage',
  'expense-categories:manage',
  'expenses:read', 'expenses:create', 'expenses:update', 'expenses:delete', 'expenses:approve',
  'promotion-types:manage', 'clients:manage',
  'promotions:read', 'promotions:create', 'promotions:update', 'promotions:delete',
  'tags:manage', 'audit:read',
]);

const ROLE_PERMS: Record<Role, ReadonlySet<Permission>> = {
  CEO: ALL,
  Admin: ALL,
  BranchManager: new Set<Permission>([
    'company:read',
    'users:read',
    'branches:read',
    'expense-categories:manage',
    'expenses:read', 'expenses:create', 'expenses:update', 'expenses:approve',
    'clients:manage',
    'promotions:read', 'promotions:create', 'promotions:update',
    'tags:manage',
  ]),
  DataEntry: new Set<Permission>([
    'company:read',
    'branches:read',
    'expenses:read', 'expenses:create', 'expenses:update',
    'promotions:read', 'promotions:create', 'promotions:update',
  ]),
  Finance: new Set<Permission>([
    'company:read',
    'billing:read',
    'branches:read',
    'expense-categories:manage',
    'expenses:read', 'expenses:approve',
    'promotions:read',
    'audit:read',
  ]),
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMS[role].has(permission);
}

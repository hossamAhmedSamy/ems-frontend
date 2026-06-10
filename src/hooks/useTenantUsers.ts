import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { TenantUser } from '../lib/types';

export interface TenantUserDetail extends TenantUser {
  companyId: string;
  roleId: string;
  branchId: string | null;
  mustChangePassword: boolean;
  branchAssignments: string[];
}

export function useTenantUsers(enabled = true) {
  return useQuery({
    queryKey: ['tenant', 'users'],
    queryFn: () => api.get<{ items: TenantUserDetail[] }>('/users'),
    enabled,
  });
}

export function useTenantUser(id: string | undefined) {
  return useQuery({
    queryKey: ['tenant', 'users', id],
    queryFn: () => api.get<TenantUserDetail>(`/users/${id}`),
    enabled: !!id,
  });
}

export interface CreateUserInput {
  fullName: string;
  username: string;
  email?: string | null;
  password: string;
  roleId: string;
  branchId?: string | null;
  branchAssignments?: string[];
}

export function useCreateTenantUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => api.post<TenantUserDetail>('/users', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'users'] }),
  });
}

export function useUpdateTenantUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<{
      fullName: string;
      email: string | null;
      roleId: string;
      branchId: string | null;
      isActive: boolean;
    }>) => api.patch<TenantUserDetail>(`/users/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', 'users'] });
      qc.invalidateQueries({ queryKey: ['tenant', 'users', id] });
    },
  });
}

export function useResetUserPassword(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newPassword: string) =>
      api.post<{ ok: true }>(`/users/${id}/reset-password`, { newPassword }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'users', id] }),
  });
}

export function useSetUserBranchAccess(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branchIds: string[]) =>
      api.put<{ ok: true }>(`/users/${id}/branch-access`, { branchIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', 'users'] });
      qc.invalidateQueries({ queryKey: ['tenant', 'users', id] });
    },
  });
}

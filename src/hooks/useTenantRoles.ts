import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface TenantRole {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export function useRoles() {
  return useQuery({
    queryKey: ['tenant', 'roles'],
    queryFn: () => api.get<{ items: TenantRole[] }>('/roles'),
  });
}

export interface CreateRoleInput {
  name: string;
  description?: string | null;
  permissions: string[];
  sourceRoleId?: string;
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRoleInput) => api.post<TenantRole>('/roles', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'roles'] }),
  });
}

export function useUpdateRole(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Omit<CreateRoleInput, 'sourceRoleId'>>) =>
      api.patch<TenantRole>(`/roles/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant', 'roles'] });
      // Editing a role can change the signed-in user's own permissions.
      qc.invalidateQueries({ queryKey: ['tenant', 'me'] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/roles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'roles'] }),
  });
}

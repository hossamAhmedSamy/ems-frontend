import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '../lib/api';
import type { SuperAdmin } from '../lib/types';

interface MeResponse {
  superAdmin: SuperAdmin;
}

export function useSuperMe() {
  return useQuery({
    queryKey: ['super-admin', 'me'],
    queryFn: async () => {
      try {
        return await api.get<MeResponse>('/super-admin/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
  });
}

export function useSuperLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; password: string }) =>
      api.post<MeResponse>('/super-admin/login', input),
    onSuccess: (data) => {
      qc.setQueryData(['super-admin', 'me'], data);
    },
  });
}

export function useSuperLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/super-admin/logout'),
    onSuccess: () => {
      qc.setQueryData(['super-admin', 'me'], null);
      qc.removeQueries({ queryKey: ['super-admin'], type: 'inactive' });
    },
  });
}

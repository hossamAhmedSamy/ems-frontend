import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api } from '../lib/api';
import type { TenantUser } from '../lib/types';
import { clearAssistantTranscript } from './useAssistant';

interface MeResponse {
  user: TenantUser & {
    companyId: string;
    mustChangePassword: boolean;
    branchId: string | null;
    roleId: string;
    permissions: string[];
  };
}

export function useTenantMe() {
  return useQuery({
    queryKey: ['tenant', 'me'],
    queryFn: async () => {
      try {
        return await api.get<MeResponse>('/auth/me');
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) return null;
        throw err;
      }
    },
    staleTime: 60_000,
  });
}

// Auth boundaries wipe the whole cache: cached data (AI usage, expenses,
// dashboards) must never bleed from one company/login into the next.
export function useTenantLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { companySlug: string; username: string; password: string }) =>
      api.post<MeResponse>('/auth/login', input),
    onSuccess: (data) => {
      qc.clear();
      clearAssistantTranscript();
      qc.setQueryData(['tenant', 'me'], data);
    },
  });
}

export function useTenantLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/auth/logout'),
    onSuccess: () => {
      qc.clear();
      clearAssistantTranscript();
      qc.setQueryData(['tenant', 'me'], null);
    },
  });
}

export function useHandoff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => api.post<MeResponse>('/auth/handoff', { token }),
    onSuccess: (data) => {
      qc.clear();
      clearAssistantTranscript();
      qc.setQueryData(['tenant', 'me'], data);
    },
  });
}

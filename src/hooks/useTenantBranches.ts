import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Branch, Region } from '../lib/types';

export function useBranches() {
  return useQuery({
    queryKey: ['tenant', 'branches'],
    queryFn: () => api.get<{ items: Branch[] }>('/branches'),
  });
}

export interface BranchInput {
  name: string;
  regionId?: string | null;
  code?: string | null;
  isActive?: boolean;
}

export function useCreateBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BranchInput) => api.post<Branch>('/branches', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'branches'] }),
  });
}

export function useUpdateBranch(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<BranchInput>) => api.patch<Branch>(`/branches/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'branches'] }),
  });
}

export function useDeleteBranch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/branches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'branches'] }),
  });
}

export function useRegions() {
  return useQuery({
    queryKey: ['tenant', 'regions'],
    queryFn: () => api.get<{ items: Region[] }>('/regions'),
  });
}

export interface RegionInput {
  name: string;
  code?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export function useCreateRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegionInput) => api.post<Region>('/regions', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'regions'] }),
  });
}

export function useUpdateRegion(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<RegionInput>) => api.patch<Region>(`/regions/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'regions'] }),
  });
}

export function useDeleteRegion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/regions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'regions'] }),
  });
}

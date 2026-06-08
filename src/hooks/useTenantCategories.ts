import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface ExpenseCategory {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useCategories() {
  return useQuery({
    queryKey: ['tenant', 'categories'],
    queryFn: () => api.get<{ items: ExpenseCategory[] }>('/expense-categories'),
  });
}

export interface CategoryInput {
  name: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => api.post<ExpenseCategory>('/expense-categories', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'categories'] }),
  });
}

export function useUpdateCategory(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CategoryInput>) =>
      api.patch<ExpenseCategory>(`/expense-categories/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'categories'] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/expense-categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'categories'] }),
  });
}

export interface Tag {
  id: string;
  companyId: string;
  name: string;
  color: string | null;
  isActive: boolean;
  createdAt: string;
}

export function useTags() {
  return useQuery({
    queryKey: ['tenant', 'tags'],
    queryFn: () => api.get<{ items: Tag[] }>('/tags'),
  });
}

export interface TagInput {
  name: string;
  color?: string | null;
  isActive?: boolean;
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TagInput) => api.post<Tag>('/tags', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'tags'] }),
  });
}

export function useUpdateTag(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<TagInput>) => api.patch<Tag>(`/tags/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'tags'] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'tags'] }),
  });
}

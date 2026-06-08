import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Paginated } from '../lib/types';

export type ExpenseStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface Expense {
  id: string;
  companyId: string;
  branchId: string;
  categoryId: string;
  amount: string;
  expenseDate: string;
  description: string;
  notes: string | null;
  referenceNumber: string | null;
  status: ExpenseStatus;
  aiCategorySuggestion: string | null;
  aiFlags: string | null;
  createdBy: string;
  updatedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExpenseQuery {
  page?: number;
  pageSize?: number;
  status?: ExpenseStatus;
  branchId?: string;
  categoryId?: string;
}

function qs(q: ExpenseQuery): string {
  const p = new URLSearchParams();
  if (q.page) p.set('page', String(q.page));
  if (q.pageSize) p.set('pageSize', String(q.pageSize));
  if (q.status) p.set('status', q.status);
  if (q.branchId) p.set('branchId', q.branchId);
  if (q.categoryId) p.set('categoryId', q.categoryId);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function useExpenses(query: ExpenseQuery = {}) {
  return useQuery({
    queryKey: ['tenant', 'expenses', query],
    queryFn: () => api.get<Paginated<Expense>>(`/expenses${qs(query)}`),
    placeholderData: keepPreviousData,
  });
}

export interface CreateExpenseInput {
  branchId: string;
  categoryId: string;
  amount: number;
  expenseDate: string;
  description: string;
  notes?: string | null;
  referenceNumber?: string | null;
  tagIds?: string[];
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => api.post<Expense>('/expenses', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'expenses'] }),
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateExpenseInput>) =>
      api.patch<Expense>(`/expenses/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'expenses'] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: true }>(`/expenses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant', 'expenses'] }),
  });
}

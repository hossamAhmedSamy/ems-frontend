import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { api } from '../lib/api';
import type {
  Company,
  CompanyDetail,
  CompanyListItem,
  CompanyStatus,
  Paginated,
  Subscription,
  SubscriptionStatus,
  SubscriptionTier,
} from '../lib/types';

export interface CompaniesQuery {
  page?: number;
  pageSize?: number;
  status?: CompanyStatus;
  tier?: SubscriptionTier;
  q?: string;
}

function buildQuery(q: CompaniesQuery): string {
  const p = new URLSearchParams();
  if (q.page) p.set('page', String(q.page));
  if (q.pageSize) p.set('pageSize', String(q.pageSize));
  if (q.status) p.set('status', q.status);
  if (q.tier) p.set('tier', q.tier);
  if (q.q) p.set('q', q.q);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function useCompanies(query: CompaniesQuery = {}) {
  return useQuery({
    queryKey: ['super-admin', 'companies', query],
    queryFn: () =>
      api.get<Paginated<CompanyListItem>>(`/super-admin/companies${buildQuery(query)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: ['super-admin', 'company', id],
    queryFn: () => api.get<CompanyDetail>(`/super-admin/companies/${id}`),
    enabled: !!id,
  });
}

export interface CreateCompanyInput {
  name: string;
  slug: string;
  ceo: { fullName: string; username: string; email?: string | null; password: string };
  subscription?: { tier?: SubscriptionTier; status?: SubscriptionStatus; trialDays?: number };
}

export function useCreateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompanyInput) =>
      api.post<{ companyId: string; ceoUserId: string; subscriptionId: string; slug: string }>(
        '/super-admin/companies',
        input,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['super-admin', 'companies'] }),
  });
}

export function useUpdateCompanyStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { status: CompanyStatus; reason?: string }) =>
      api.patch<Company>(`/super-admin/companies/${id}/status`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'companies'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'company', id] });
    },
  });
}

export function useUpdateSubscription(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Pick<Subscription, 'tier' | 'status' | 'trialEndsAt' | 'currentPeriodEndsAt' | 'billingEmail'>>) =>
      api.patch<Subscription>(`/super-admin/companies/${id}/subscription`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'companies'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'company', id] });
    },
  });
}

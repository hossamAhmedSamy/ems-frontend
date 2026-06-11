import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface SuperAdminStats {
  platform: {
    totalCompanies: number;
    activeCompanies: number;
    suspendedCompanies: number;
    disabledCompanies: number;
    newThisMonth: number;
    tiers: { Free: number; Pro: number; Ultimate: number };
    trialing: number;
    paidActive: number;
  };
  usage: {
    totalUsers: number;
    liveSessions: number;
    usersActiveToday: number;
    expensesToday: number;
    expensesThisMonth: number;
    topTenants: { id: string; name: string; expenseCount: number }[];
  };
  growth: { month: string; companies: number; users: number; expenses: number }[];
  security: {
    failedLogins24h: number;
    failedLogins7d: number;
    signupAttempts7d: number;
    signupSuccesses7d: number;
  };
  revenue: {
    mrr: number | null;
    arr: number | null;
    churnPct: number | null;
    conversionPct: number | null;
  };
}

export function useSuperAdminStats() {
  return useQuery({
    queryKey: ['super-admin', 'stats'],
    queryFn: () => api.get<SuperAdminStats>('/super-admin/stats'),
    staleTime: 60_000,
  });
}

import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface MonthPoint {
  month: string; // 'YYYY-MM'
  total: number;
  count: number;
}

export interface SpendEntry {
  id: string;
  name: string;
  total: number;
}

export interface BranchSpendEntry extends SpendEntry {
  previousTotal: number;
}

export interface Anomaly {
  kind: 'category' | 'branch';
  id: string;
  name: string;
  current: number;
  baseline: number;
  pct: number;
}

export interface DashboardPayload {
  currency: string;
  kpis: {
    thisMonthTotal: number;
    lastMonthTotal: number;
    momPct: number | null;
    avgMonthly: number;
    totalRecords: number;
    activeBranches: number;
    eomProjection: number | null;
  };
  trend: MonthPoint[];
  byCategory: SpendEntry[];
  byBranch: BranchSpendEntry[];
  insights: {
    topCategory: SpendEntry | null;
    topBranch: BranchSpendEntry | null;
    biggestMover: {
      id: string;
      name: string;
      current: number;
      previous: number;
      delta: number;
      pct: number | null;
    } | null;
    anomalies: Anomaly[];
  };
}

export function useTenantDashboard(enabled = true) {
  return useQuery({
    queryKey: ['tenant', 'dashboard'],
    queryFn: () => api.get<DashboardPayload>('/dashboard'),
    staleTime: 60_000,
    enabled,
  });
}

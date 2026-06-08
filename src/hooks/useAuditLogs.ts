import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AuditLog, Paginated } from '../lib/types';

export interface AuditQuery {
  page?: number;
  pageSize?: number;
  companyId?: string;
  entityName?: string;
  entityId?: string;
  performedBy?: string;
  action?: 'Create' | 'Update' | 'Delete';
  from?: string;
  to?: string;
}

function buildQuery(q: AuditQuery): string {
  const p = new URLSearchParams();
  if (q.page) p.set('page', String(q.page));
  if (q.pageSize) p.set('pageSize', String(q.pageSize));
  if (q.companyId) p.set('companyId', q.companyId);
  if (q.entityName) p.set('entityName', q.entityName);
  if (q.entityId) p.set('entityId', q.entityId);
  if (q.performedBy) p.set('performedBy', q.performedBy);
  if (q.action) p.set('action', q.action);
  if (q.from) p.set('from', q.from);
  if (q.to) p.set('to', q.to);
  const s = p.toString();
  return s ? `?${s}` : '';
}

export function useAuditLogs(query: AuditQuery = {}) {
  return useQuery({
    queryKey: ['super-admin', 'audit-logs', query],
    queryFn: () =>
      api.get<Paginated<AuditLog>>(`/super-admin/audit-logs${buildQuery(query)}`),
    placeholderData: keepPreviousData,
  });
}

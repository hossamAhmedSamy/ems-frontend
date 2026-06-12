import type { AuditLog } from './types';

type Json = Record<string, unknown>;

// Fields that are never interesting to a human reading the audit trail.
const HIDDEN_FIELDS = new Set([
  'id',
  'companyId',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'passwordHash',
]);

const LABEL_KEYS = ['name', 'fullName', 'description', 'title', 'username', 'code'];

function parseJson(raw: string | null): Json | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : null;
  } catch {
    return null;
  }
}

/** Human-readable identifier for the affected entity (e.g. the branch name,
 * expense description, user full name), pulled from the stored snapshots. */
export function entityLabel(log: AuditLog): string | null {
  const values = parseJson(log.newValues) ?? parseJson(log.oldValues);
  if (!values) return null;
  for (const key of LABEL_KEYS) {
    const v = values[key];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
}

/** Field-level old → new diff for Update events. Routes store full row
 * snapshots, so the diff is computed here; stored changedFields (when present)
 * take precedence. */
export function fieldChanges(log: AuditLog): FieldChange[] {
  const oldV = parseJson(log.oldValues);
  const newV = parseJson(log.newValues);
  if (!oldV || !newV) return [];

  let fields: string[];
  try {
    const stored = log.changedFields ? JSON.parse(log.changedFields) : null;
    fields = Array.isArray(stored)
      ? stored.filter((f): f is string => typeof f === 'string')
      : [...new Set([...Object.keys(oldV), ...Object.keys(newV)])];
  } catch {
    fields = [...new Set([...Object.keys(oldV), ...Object.keys(newV)])];
  }

  return fields
    .filter((f) => !HIDDEN_FIELDS.has(f))
    .filter((f) => JSON.stringify(oldV[f]) !== JSON.stringify(newV[f]))
    .map((f) => ({ field: f, from: oldV[f], to: newV[f] }));
}

/** Snapshot entries for Create (newValues) and Delete (oldValues) events. */
export function snapshotEntries(log: AuditLog): Array<{ field: string; value: unknown }> {
  const values = log.action === 'Delete' ? parseJson(log.oldValues) : parseJson(log.newValues);
  if (!values) return [];
  return Object.entries(values)
    .filter(([field, value]) => !HIDDEN_FIELDS.has(field) && value != null && value !== '')
    .map(([field, value]) => ({ field, value }));
}

/** camelCase / snake_case → "Title Case" for display. */
export function prettyField(field: string): string {
  const spaced = field.replace(/_/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function formatAuditValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string' && ISO_DATE.test(value)) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
  }
  if (typeof value === 'object') return JSON.stringify(value);
  const s = String(value);
  return s.length > 120 ? s.slice(0, 117) + '…' : s;
}

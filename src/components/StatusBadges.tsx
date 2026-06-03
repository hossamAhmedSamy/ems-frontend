import type {
  CompanyStatus,
  SubscriptionStatus,
  SubscriptionTier,
} from '../lib/types';
import { Badge, type BadgeProps } from './ui/Badge';

export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const tone: BadgeProps['tone'] =
    status === 'Active' ? 'success' : status === 'Suspended' ? 'warning' : 'danger';
  return <Badge tone={tone}>{status}</Badge>;
}

export function SubscriptionTierBadge({ tier }: { tier: SubscriptionTier }) {
  const tone: BadgeProps['tone'] =
    tier === 'Free' ? 'neutral' : tier === 'Pro' ? 'brand' : 'violet';
  return <Badge tone={tone}>{tier}</Badge>;
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const tone: BadgeProps['tone'] =
    status === 'Active'
      ? 'success'
      : status === 'Trialing'
        ? 'info'
        : status === 'PastDue'
          ? 'warning'
          : 'danger';
  return <Badge tone={tone}>{status}</Badge>;
}

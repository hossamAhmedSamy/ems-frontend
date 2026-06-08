export type CompanyStatus = 'Active' | 'Suspended' | 'Disabled';
export type SubscriptionTier = 'Free' | 'Pro' | 'Ultimate';
export type SubscriptionStatus =
  | 'Trialing'
  | 'Active'
  | 'PastDue'
  | 'Canceled'
  | 'Paused'
  | 'Incomplete';

export interface SuperAdmin {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  passwordChangedAt?: string | null;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
  onboardingStatus: 'Pending' | 'InProgress' | 'Completed';
  onboardingCompletedAt: string | null;
  createdAt: string;
}

export interface Subscription {
  id: string;
  companyId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingEmail: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  currentPeriodEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  fullName: string;
  username: string;
  email: string | null;
  role: 'CEO' | 'Admin' | 'BranchManager' | 'DataEntry' | 'Finance';
  isActive: boolean;
  createdAt: string;
}

export interface CompanyListItem {
  company: Company;
  subscription: Subscription | null;
  userCount: number;
}

export interface CompanyDetail {
  company: Company;
  subscription: Subscription | null;
  users: TenantUser[];
}

export interface Branch {
  id: string;
  companyId: string;
  regionId: string | null;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Region {
  id: string;
  companyId: string;
  name: string;
  code: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  companyId: string;
  entityName: string;
  entityId: string;
  action: 'Create' | 'Update' | 'Delete';
  oldValues: string | null;
  newValues: string | null;
  changedFields: string | null;
  performedBy: string | null;
  ipAddress: string | null;
  performedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

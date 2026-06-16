export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'active' | 'inactive' | 'suspended' | 'expired';

export interface Organization {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  logo?: string;
  domain: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  maxUsers: number;
  currentUserCount: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  budget?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  organizationId: string;
  departmentId: string;
  name: string;
  description?: string;
  leaderId: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationRequest {
  name: string;
  displayName: string;
  domain: string;
  subscriptionTier: SubscriptionTier;
  description?: string;
}

export interface UpdateOrganizationRequest {
  displayName?: string;
  description?: string;
  logo?: string;
  subscriptionTier?: SubscriptionTier;
  subscriptionStatus?: SubscriptionStatus;
  maxUsers?: number;
}

export interface OrganizationSettings {
  organizationId: string;
  enableSAML: boolean;
  enableOAuth: boolean;
  enforceIPRestriction: boolean;
  allowedIPs?: string[];
  sessionTimeout: number;
  passwordExpirationDays?: number;
  requirePasswordChange: boolean;
  createdAt: Date;
  updatedAt: Date;
}

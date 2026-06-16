export type UserRole = 'admin' | 'manager' | 'user';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  teamId?: string;
  organizationId: string;
  twoFactorEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  teamId?: string;
  organizationId: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  department?: string;
  teamId?: string;
}

export interface BulkUserImportRequest {
  users: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    department?: string;
  }>;
  organizationId: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  twoFactorEnabledUsers: number;
  totalOrganizations: number;
  totalPolicies: number;
  recentAuditLogs: number;
  systemHealth: SystemHealth;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  databaseStatus: 'connected' | 'disconnected';
  lastCheckTime: Date;
  uptime: number;
  errorRate: number;
}

export interface SecurityAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers?: number;
  createdAt: Date;
  resolved: boolean;
}

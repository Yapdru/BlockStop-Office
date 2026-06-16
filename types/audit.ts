export type AuditActionType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'POLICY_CREATED'
  | 'POLICY_UPDATED'
  | 'POLICY_DELETED'
  | 'ORGANIZATION_CREATED'
  | 'ORGANIZATION_UPDATED'
  | 'SETTINGS_CHANGED'
  | 'THREAT_DETECTED'
  | 'AUTH_FAILED'
  | 'PERMISSION_DENIED'
  | 'BULK_OPERATION'
  | 'EXPORT_REQUESTED';

export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  actionType: AuditActionType;
  severity: AuditSeverity;
  resourceType: string;
  resourceId: string;
  resourceName: string;
  description: string;
  changes?: Record<string, { before: any; after: any }>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface AuditLogQuery {
  organizationId: string;
  startDate?: Date;
  endDate?: Date;
  actionTypes?: AuditActionType[];
  userIds?: string[];
  severity?: AuditSeverity;
  resourceType?: string;
  status?: 'success' | 'failure';
  limit?: number;
  offset?: number;
}

export interface AuditLogResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  startDate?: Date;
  endDate?: Date;
  includeMetadata?: boolean;
}

export interface ThreatEvent {
  id: string;
  organizationId: string;
  userId: string;
  threatType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectionTime: Date;
  resolved: boolean;
  resolutionTime?: Date;
  metadata?: Record<string, any>;
}

import { execute, query } from '@/lib/db';
import { AuditLog, AuditActionType, AuditSeverity, AuditLogQuery } from '@/types/audit';
import { v4 as uuidv4 } from 'uuid';

export class AuditLogger {
  public async log(
    organizationId: string,
    actionType: AuditActionType,
    severity: AuditSeverity,
    resourceType: string,
    resourceId: string,
    resourceName: string,
    description: string,
    options?: {
      userId?: string;
      changes?: Record<string, { before: any; after: any }>;
      ipAddress?: string;
      userAgent?: string;
      status?: 'success' | 'failure';
      errorMessage?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<AuditLog | null> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await execute(
        `INSERT INTO audit_logs (
          id, organization_id, user_id, action_type, severity, resource_type,
          resource_id, resource_name, description, changes, ip_address,
          user_agent, status, error_message, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          id,
          organizationId,
          options?.userId || null,
          actionType,
          severity,
          resourceType,
          resourceId,
          resourceName,
          description,
          options?.changes ? JSON.stringify(options.changes) : null,
          options?.ipAddress || null,
          options?.userAgent || null,
          options?.status || 'success',
          options?.errorMessage || null,
          options?.metadata ? JSON.stringify(options.metadata) : null,
          now,
        ]
      );

      if (result > 0) {
        return {
          id,
          organizationId,
          userId: options?.userId,
          actionType,
          severity,
          resourceType,
          resourceId,
          resourceName,
          description,
          changes: options?.changes,
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
          status: options?.status || 'success',
          errorMessage: options?.errorMessage,
          metadata: options?.metadata,
          createdAt: now,
        };
      }

      return null;
    } catch (error) {
      console.error('Error logging audit event:', error);
      return null;
    }
  }

  public async getUserLoginAudit(
    organizationId: string,
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<AuditLog | null> {
    return this.log(
      organizationId,
      'USER_LOGIN',
      'info',
      'user',
      userId,
      'User Login',
      'User successfully logged in',
      {
        userId,
        ipAddress,
        userAgent,
        status: 'success',
      }
    );
  }

  public async getUserLogoutAudit(
    organizationId: string,
    userId: string,
    ipAddress: string
  ): Promise<AuditLog | null> {
    return this.log(
      organizationId,
      'USER_LOGOUT',
      'info',
      'user',
      userId,
      'User Logout',
      'User logged out',
      {
        userId,
        ipAddress,
        status: 'success',
      }
    );
  }

  public async getPolicyChangeAudit(
    organizationId: string,
    userId: string,
    policyType: string,
    policyId: string,
    policyName: string,
    changes: Record<string, { before: any; after: any }>
  ): Promise<AuditLog | null> {
    return this.log(
      organizationId,
      'POLICY_UPDATED',
      'warning',
      policyType,
      policyId,
      policyName,
      `${policyType} policy updated`,
      {
        userId,
        changes,
        status: 'success',
      }
    );
  }

  public async logAuthFailure(
    organizationId: string,
    email: string,
    ipAddress: string,
    reason: string
  ): Promise<AuditLog | null> {
    return this.log(
      organizationId,
      'AUTH_FAILED',
      'warning',
      'authentication',
      email,
      email,
      `Authentication failed: ${reason}`,
      {
        ipAddress,
        status: 'failure',
        errorMessage: reason,
      }
    );
  }

  public async logThreatDetected(
    organizationId: string,
    userId: string,
    threatType: string,
    severity: AuditSeverity,
    description: string
  ): Promise<AuditLog | null> {
    return this.log(
      organizationId,
      'THREAT_DETECTED',
      severity,
      'threat',
      userId,
      threatType,
      description,
      {
        userId,
        status: 'success',
      }
    );
  }

  public async getLogs(query: AuditLogQuery): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      let whereClause = 'WHERE organization_id = $1';
      let paramIndex = 2;
      const params: any[] = [query.organizationId];

      if (query.startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(query.startDate);
        paramIndex++;
      }

      if (query.endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(query.endDate);
        paramIndex++;
      }

      if (query.actionTypes && query.actionTypes.length > 0) {
        whereClause += ` AND action_type = ANY($${paramIndex})`;
        params.push(query.actionTypes);
        paramIndex++;
      }

      if (query.userIds && query.userIds.length > 0) {
        whereClause += ` AND user_id = ANY($${paramIndex})`;
        params.push(query.userIds);
        paramIndex++;
      }

      if (query.severity) {
        whereClause += ` AND severity = $${paramIndex}`;
        params.push(query.severity);
        paramIndex++;
      }

      if (query.resourceType) {
        whereClause += ` AND resource_type = $${paramIndex}`;
        params.push(query.resourceType);
        paramIndex++;
      }

      if (query.status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(query.status);
        paramIndex++;
      }

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      const logs = await query<AuditLog>(
        `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...params, limit, offset]
      );

      const countResult = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
        params
      );

      const total = parseInt(countResult[0]?.count || '0', 10);

      return { logs, total };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { logs: [], total: 0 };
    }
  }

  public async exportLogs(
    organizationId: string,
    format: 'csv' | 'json',
    startDate?: Date,
    endDate?: Date
  ): Promise<string | null> {
    try {
      const { logs } = await this.getLogs({
        organizationId,
        startDate,
        endDate,
        limit: 10000,
      });

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      }

      if (format === 'csv') {
        return this.convertToCSV(logs);
      }

      return null;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      return null;
    }
  }

  private convertToCSV(logs: AuditLog[]): string {
    if (logs.length === 0) return '';

    const headers = [
      'ID',
      'Organization ID',
      'User ID',
      'Action Type',
      'Severity',
      'Resource Type',
      'Resource ID',
      'Resource Name',
      'Description',
      'IP Address',
      'Status',
      'Created At',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.organizationId,
      log.userId || '',
      log.actionType,
      log.severity,
      log.resourceType,
      log.resourceId,
      log.resourceName,
      log.description.replace(/"/g, '""'),
      log.ipAddress || '',
      log.status,
      log.createdAt?.toISOString() || '',
    ]);

    const csvContent = [
      headers.map((h) => `"${h}"`).join(','),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  public async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await execute(
        'DELETE FROM audit_logs WHERE created_at < $1',
        [cutoffDate]
      );

      return result;
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      return 0;
    }
  }
}

export const auditLogger = new AuditLogger();

import { query, execute } from '@/lib/db';
import { auditLogger } from '@/lib/audit/audit-logger';
import { v4 as uuidv4 } from 'uuid';

export interface SecurityPolicy {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  policyType: 'password' | '2fa' | 'session' | 'device';
  enabled: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface VPNPolicy {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  allowedProviders: string[];
  dataUsageLimitGb?: number;
  enabled: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanPolicy {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  scanFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  schedule?: Record<string, any>;
  enabled: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DLPRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  pattern?: string;
  action: 'block' | 'alert' | 'log';
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class PolicyManager {
  // Security Policies
  public async createSecurityPolicy(
    organizationId: string,
    name: string,
    policyType: 'password' | '2fa' | 'session' | 'device',
    settings: Record<string, any>,
    createdBy: string,
    description?: string
  ): Promise<SecurityPolicy | null> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await execute(
        `INSERT INTO security_policies (
          id, organization_id, name, description, policy_type, enabled, settings, created_at, updated_at, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [id, organizationId, name, description || null, policyType, true, JSON.stringify(settings), now, now, createdBy]
      );

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'POLICY_CREATED',
          'warning',
          'security_policy',
          id,
          name,
          `Security policy created: ${policyType}`,
          { userId: createdBy, status: 'success' }
        );

        return {
          id,
          organizationId,
          name,
          description,
          policyType,
          enabled: true,
          settings,
          createdAt: now,
          updatedAt: now,
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating security policy:', error);
      return null;
    }
  }

  public async getSecurityPolicy(policyId: string): Promise<SecurityPolicy | null> {
    try {
      const result = await query<any>(
        `SELECT id, organization_id as "organizationId", name, description, policy_type as "policyType",
         enabled, settings, created_at as "createdAt", updated_at as "updatedAt"
         FROM security_policies WHERE id = $1`,
        [policyId]
      );

      if (result.length > 0) {
        return {
          ...result[0],
          settings: typeof result[0].settings === 'string' ? JSON.parse(result[0].settings) : result[0].settings,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching security policy:', error);
      return null;
    }
  }

  public async listSecurityPolicies(organizationId: string): Promise<SecurityPolicy[]> {
    try {
      const results = await query<any>(
        `SELECT id, organization_id as "organizationId", name, description, policy_type as "policyType",
         enabled, settings, created_at as "createdAt", updated_at as "updatedAt"
         FROM security_policies WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );

      return results.map((r) => ({
        ...r,
        settings: typeof r.settings === 'string' ? JSON.parse(r.settings) : r.settings,
      }));
    } catch (error) {
      console.error('Error listing security policies:', error);
      return [];
    }
  }

  public async updateSecurityPolicy(
    policyId: string,
    organizationId: string,
    updates: { name?: string; description?: string; enabled?: boolean; settings?: Record<string, any> },
    updatedBy: string
  ): Promise<SecurityPolicy | null> {
    try {
      const existing = await this.getSecurityPolicy(policyId);
      if (!existing) return null;

      const changes: Record<string, any> = {};
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name && updates.name !== existing.name) {
        changes['name'] = { before: existing.name, after: updates.name };
        fields.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }

      if (updates.description !== undefined) {
        changes['description'] = { before: existing.description, after: updates.description };
        fields.push(`description = $${paramIndex++}`);
        values.push(updates.description || null);
      }

      if (updates.enabled !== undefined && updates.enabled !== existing.enabled) {
        changes['enabled'] = { before: existing.enabled, after: updates.enabled };
        fields.push(`enabled = $${paramIndex++}`);
        values.push(updates.enabled);
      }

      if (updates.settings) {
        changes['settings'] = { before: existing.settings, after: updates.settings };
        fields.push(`settings = $${paramIndex++}`);
        values.push(JSON.stringify(updates.settings));
      }

      if (fields.length === 0) return existing;

      fields.push(`updated_at = $${paramIndex++}`);
      fields.push(`updated_by = $${paramIndex++}`);
      values.push(new Date());
      values.push(updatedBy);
      values.push(policyId);

      const result = await execute(
        `UPDATE security_policies SET ${fields.join(', ')} WHERE id = $${paramIndex + 1}`,
        values
      );

      if (result > 0) {
        await auditLogger.getPolicyChangeAudit(organizationId, updatedBy, 'security_policy', policyId, existing.name, changes);
        return this.getSecurityPolicy(policyId);
      }

      return null;
    } catch (error) {
      console.error('Error updating security policy:', error);
      return null;
    }
  }

  public async deleteSecurityPolicy(policyId: string, organizationId: string, deletedBy: string): Promise<boolean> {
    try {
      const policy = await this.getSecurityPolicy(policyId);
      if (!policy) return false;

      const result = await execute('DELETE FROM security_policies WHERE id = $1', [policyId]);

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'POLICY_DELETED',
          'critical',
          'security_policy',
          policyId,
          policy.name,
          'Security policy deleted',
          { userId: deletedBy, status: 'success' }
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting security policy:', error);
      return false;
    }
  }

  // VPN Policies
  public async createVPNPolicy(
    organizationId: string,
    name: string,
    allowedProviders: string[],
    createdBy: string,
    options?: {
      description?: string;
      dataUsageLimitGb?: number;
      settings?: Record<string, any>;
    }
  ): Promise<VPNPolicy | null> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await execute(
        `INSERT INTO vpn_policies (
          id, organization_id, name, description, allowed_providers, data_usage_limit_gb,
          enabled, settings, created_at, updated_at, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          organizationId,
          name,
          options?.description || null,
          allowedProviders,
          options?.dataUsageLimitGb || null,
          true,
          JSON.stringify(options?.settings || {}),
          now,
          now,
          createdBy,
        ]
      );

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'POLICY_CREATED',
          'warning',
          'vpn_policy',
          id,
          name,
          'VPN policy created',
          { userId: createdBy, status: 'success' }
        );

        return {
          id,
          organizationId,
          name,
          description: options?.description,
          allowedProviders,
          dataUsageLimitGb: options?.dataUsageLimitGb,
          enabled: true,
          settings: options?.settings || {},
          createdAt: now,
          updatedAt: now,
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating VPN policy:', error);
      return null;
    }
  }

  public async listVPNPolicies(organizationId: string): Promise<VPNPolicy[]> {
    try {
      const results = await query<any>(
        `SELECT id, organization_id as "organizationId", name, description, allowed_providers as "allowedProviders",
         data_usage_limit_gb as "dataUsageLimitGb", enabled, settings, created_at as "createdAt", updated_at as "updatedAt"
         FROM vpn_policies WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );

      return results.map((r) => ({
        ...r,
        settings: typeof r.settings === 'string' ? JSON.parse(r.settings) : r.settings,
      }));
    } catch (error) {
      console.error('Error listing VPN policies:', error);
      return [];
    }
  }

  // Scan Policies
  public async createScanPolicy(
    organizationId: string,
    name: string,
    scanFrequency: 'hourly' | 'daily' | 'weekly' | 'monthly',
    createdBy: string,
    options?: {
      description?: string;
      schedule?: Record<string, any>;
      settings?: Record<string, any>;
    }
  ): Promise<ScanPolicy | null> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await execute(
        `INSERT INTO scan_policies (
          id, organization_id, name, description, scan_frequency, schedule,
          enabled, settings, created_at, updated_at, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          id,
          organizationId,
          name,
          options?.description || null,
          scanFrequency,
          options?.schedule ? JSON.stringify(options.schedule) : null,
          true,
          JSON.stringify(options?.settings || {}),
          now,
          now,
          createdBy,
        ]
      );

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'POLICY_CREATED',
          'warning',
          'scan_policy',
          id,
          name,
          `Scan policy created: ${scanFrequency}`,
          { userId: createdBy, status: 'success' }
        );

        return {
          id,
          organizationId,
          name,
          description: options?.description,
          scanFrequency,
          schedule: options?.schedule,
          enabled: true,
          settings: options?.settings || {},
          createdAt: now,
          updatedAt: now,
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating scan policy:', error);
      return null;
    }
  }

  public async listScanPolicies(organizationId: string): Promise<ScanPolicy[]> {
    try {
      const results = await query<any>(
        `SELECT id, organization_id as "organizationId", name, description, scan_frequency as "scanFrequency",
         schedule, enabled, settings, created_at as "createdAt", updated_at as "updatedAt"
         FROM scan_policies WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );

      return results.map((r) => ({
        ...r,
        schedule: r.schedule ? (typeof r.schedule === 'string' ? JSON.parse(r.schedule) : r.schedule) : undefined,
        settings: typeof r.settings === 'string' ? JSON.parse(r.settings) : r.settings,
      }));
    } catch (error) {
      console.error('Error listing scan policies:', error);
      return [];
    }
  }

  // DLP Rules
  public async createDLPRule(
    organizationId: string,
    name: string,
    action: 'block' | 'alert' | 'log',
    severity: 'low' | 'medium' | 'high' | 'critical',
    createdBy: string,
    options?: {
      description?: string;
      pattern?: string;
      settings?: Record<string, any>;
    }
  ): Promise<DLPRule | null> {
    try {
      const id = uuidv4();
      const now = new Date();

      const result = await execute(
        `INSERT INTO dlp_rules (
          id, organization_id, name, description, pattern, action, severity,
          enabled, settings, created_at, updated_at, updated_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          organizationId,
          name,
          options?.description || null,
          options?.pattern || null,
          action,
          severity,
          true,
          options?.settings ? JSON.stringify(options.settings) : null,
          now,
          now,
          createdBy,
        ]
      );

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'POLICY_CREATED',
          'warning',
          'dlp_rule',
          id,
          name,
          `DLP rule created: ${action}`,
          { userId: createdBy, status: 'success' }
        );

        return {
          id,
          organizationId,
          name,
          description: options?.description,
          pattern: options?.pattern,
          action,
          enabled: true,
          severity,
          settings: options?.settings,
          createdAt: now,
          updatedAt: now,
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating DLP rule:', error);
      return null;
    }
  }

  public async listDLPRules(organizationId: string): Promise<DLPRule[]> {
    try {
      const results = await query<any>(
        `SELECT id, organization_id as "organizationId", name, description, pattern, action, severity,
         enabled, settings, created_at as "createdAt", updated_at as "updatedAt"
         FROM dlp_rules WHERE organization_id = $1 ORDER BY created_at DESC`,
        [organizationId]
      );

      return results.map((r) => ({
        ...r,
        settings: r.settings ? (typeof r.settings === 'string' ? JSON.parse(r.settings) : r.settings) : undefined,
      }));
    } catch (error) {
      console.error('Error listing DLP rules:', error);
      return [];
    }
  }
}

export const policyManager = new PolicyManager();

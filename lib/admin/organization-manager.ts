import { query, execute } from '@/lib/db';
import { Organization, SubscriptionTier, OrganizationSettings } from '@/types/organization';
import { auditLogger } from '@/lib/audit/audit-logger';
import { v4 as uuidv4 } from 'uuid';

export class OrganizationManager {
  public async createOrganization(
    name: string,
    displayName: string,
    domain: string,
    subscriptionTier: SubscriptionTier,
    createdBy: string,
    description?: string
  ): Promise<Organization | null> {
    try {
      const id = uuidv4();
      const now = new Date();
      const endDate = new Date();

      // Set subscription end date based on tier
      const monthsToAdd = subscriptionTier === 'enterprise' ? 12 : subscriptionTier === 'professional' ? 6 : 3;
      endDate.setMonth(endDate.getMonth() + monthsToAdd);

      const result = await execute(
        `INSERT INTO organizations (
          id, name, display_name, description, domain, subscription_tier,
          subscription_status, subscription_start_date, subscription_end_date,
          created_at, updated_at, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          id,
          name,
          displayName,
          description || null,
          domain,
          subscriptionTier,
          'active',
          now,
          endDate,
          now,
          now,
          createdBy,
        ]
      );

      if (result > 0) {
        // Create organization settings
        await execute(
          `INSERT INTO organization_settings (
            organization_id, enable_saml, enable_oauth, enforce_ip_restriction,
            session_timeout_minutes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, false, false, false, 30, now, now]
        );

        await auditLogger.log(
          id,
          'ORGANIZATION_CREATED',
          'warning',
          'organization',
          id,
          name,
          `Organization created: ${subscriptionTier}`,
          { userId: createdBy, status: 'success' }
        );

        return {
          id,
          name,
          displayName,
          description,
          domain,
          subscriptionTier,
          subscriptionStatus: 'active',
          subscriptionStartDate: now,
          subscriptionEndDate: endDate,
          maxUsers: subscriptionTier === 'enterprise' ? 10000 : subscriptionTier === 'professional' ? 500 : 100,
          currentUserCount: 0,
          createdAt: now,
          updatedAt: now,
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating organization:', error);
      return null;
    }
  }

  public async getOrganization(organizationId: string): Promise<Organization | null> {
    try {
      const result = await query<any>(
        `SELECT id, name, display_name as "displayName", description, logo, domain,
         subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
         subscription_start_date as "subscriptionStartDate", subscription_end_date as "subscriptionEndDate",
         max_users as "maxUsers", current_user_count as "currentUserCount",
         created_at as "createdAt", updated_at as "updatedAt"
         FROM organizations WHERE id = $1`,
        [organizationId]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  }

  public async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    try {
      const result = await query<any>(
        `SELECT id, name, display_name as "displayName", description, logo, domain,
         subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
         subscription_start_date as "subscriptionStartDate", subscription_end_date as "subscriptionEndDate",
         max_users as "maxUsers", current_user_count as "currentUserCount",
         created_at as "createdAt", updated_at as "updatedAt"
         FROM organizations WHERE domain = $1`,
        [domain]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching organization by domain:', error);
      return null;
    }
  }

  public async listOrganizations(limit: number = 50, offset: number = 0): Promise<{ organizations: Organization[]; total: number }> {
    try {
      const organizations = await query<any>(
        `SELECT id, name, display_name as "displayName", description, logo, domain,
         subscription_tier as "subscriptionTier", subscription_status as "subscriptionStatus",
         subscription_start_date as "subscriptionStartDate", subscription_end_date as "subscriptionEndDate",
         max_users as "maxUsers", current_user_count as "currentUserCount",
         created_at as "createdAt", updated_at as "updatedAt"
         FROM organizations ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM organizations'
      );

      const total = parseInt(countResult[0]?.count || '0', 10);

      return { organizations, total };
    } catch (error) {
      console.error('Error listing organizations:', error);
      return { organizations: [], total: 0 };
    }
  }

  public async updateOrganization(
    organizationId: string,
    updates: {
      displayName?: string;
      description?: string;
      logo?: string;
      subscriptionTier?: SubscriptionTier;
      subscriptionStatus?: string;
      maxUsers?: number;
    },
    updatedBy: string
  ): Promise<Organization | null> {
    try {
      const existing = await this.getOrganization(organizationId);
      if (!existing) return null;

      const changes: Record<string, any> = {};
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.displayName && updates.displayName !== existing.displayName) {
        changes['displayName'] = { before: existing.displayName, after: updates.displayName };
        fields.push(`display_name = $${paramIndex++}`);
        values.push(updates.displayName);
      }

      if (updates.description !== undefined) {
        changes['description'] = { before: existing.description, after: updates.description };
        fields.push(`description = $${paramIndex++}`);
        values.push(updates.description || null);
      }

      if (updates.logo) {
        fields.push(`logo = $${paramIndex++}`);
        values.push(updates.logo);
      }

      if (updates.subscriptionTier && updates.subscriptionTier !== existing.subscriptionTier) {
        changes['subscriptionTier'] = { before: existing.subscriptionTier, after: updates.subscriptionTier };
        fields.push(`subscription_tier = $${paramIndex++}`);
        values.push(updates.subscriptionTier);
      }

      if (updates.subscriptionStatus && updates.subscriptionStatus !== existing.subscriptionStatus) {
        changes['subscriptionStatus'] = { before: existing.subscriptionStatus, after: updates.subscriptionStatus };
        fields.push(`subscription_status = $${paramIndex++}`);
        values.push(updates.subscriptionStatus);
      }

      if (updates.maxUsers && updates.maxUsers !== existing.maxUsers) {
        changes['maxUsers'] = { before: existing.maxUsers, after: updates.maxUsers };
        fields.push(`max_users = $${paramIndex++}`);
        values.push(updates.maxUsers);
      }

      if (fields.length === 0) return existing;

      fields.push(`updated_at = $${paramIndex++}`);
      fields.push(`updated_by = $${paramIndex++}`);
      values.push(new Date());
      values.push(updatedBy);
      values.push(organizationId);

      const result = await execute(
        `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${paramIndex + 1}`,
        values
      );

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'ORGANIZATION_UPDATED',
          'warning',
          'organization',
          organizationId,
          existing.name,
          'Organization updated',
          { userId: updatedBy, changes: Object.keys(changes).length > 0 ? changes : undefined, status: 'success' }
        );

        return this.getOrganization(organizationId);
      }

      return null;
    } catch (error) {
      console.error('Error updating organization:', error);
      return null;
    }
  }

  public async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
    try {
      const result = await query<any>(
        `SELECT id, organization_id as "organizationId", enable_saml as "enableSAML",
         enable_oauth as "enableOAuth", enforce_ip_restriction as "enforceIPRestriction",
         allowed_ips as "allowedIPs", session_timeout_minutes as "sessionTimeout",
         password_expiration_days as "passwordExpirationDays",
         require_password_change as "requirePasswordChange",
         created_at as "createdAt", updated_at as "updatedAt"
         FROM organization_settings WHERE organization_id = $1`,
        [organizationId]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching organization settings:', error);
      return null;
    }
  }

  public async updateOrganizationSettings(
    organizationId: string,
    settings: Partial<OrganizationSettings>,
    updatedBy: string
  ): Promise<OrganizationSettings | null> {
    try {
      const existing = await this.getOrganizationSettings(organizationId);
      if (!existing) return null;

      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (settings.enableSAML !== undefined) {
        fields.push(`enable_saml = $${paramIndex++}`);
        values.push(settings.enableSAML);
      }

      if (settings.enableOAuth !== undefined) {
        fields.push(`enable_oauth = $${paramIndex++}`);
        values.push(settings.enableOAuth);
      }

      if (settings.enforceIPRestriction !== undefined) {
        fields.push(`enforce_ip_restriction = $${paramIndex++}`);
        values.push(settings.enforceIPRestriction);
      }

      if (settings.allowedIPs) {
        fields.push(`allowed_ips = $${paramIndex++}`);
        values.push(settings.allowedIPs);
      }

      if (settings.sessionTimeout !== undefined) {
        fields.push(`session_timeout_minutes = $${paramIndex++}`);
        values.push(settings.sessionTimeout);
      }

      if (fields.length === 0) return existing;

      fields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());
      values.push(organizationId);

      const result = await execute(
        `UPDATE organization_settings SET ${fields.join(', ')} WHERE organization_id = $${paramIndex + 1}`,
        values
      );

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'SETTINGS_CHANGED',
          'warning',
          'organization_settings',
          organizationId,
          'Settings',
          'Organization settings updated',
          { userId: updatedBy, status: 'success' }
        );

        return this.getOrganizationSettings(organizationId);
      }

      return null;
    } catch (error) {
      console.error('Error updating organization settings:', error);
      return null;
    }
  }

  public async getStats(organizationId: string): Promise<any> {
    try {
      const org = await this.getOrganization(organizationId);
      const totalPolicies = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM security_policies WHERE organization_id = $1`,
        [organizationId]
      );

      const recentLogs = await query<{ count: string }>(
        `SELECT COUNT(*) as count FROM audit_logs WHERE organization_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
        [organizationId]
      );

      return {
        organization: org,
        totalPolicies: parseInt(totalPolicies[0]?.count || '0', 10),
        recentAuditLogs: parseInt(recentLogs[0]?.count || '0', 10),
        subscriptionStatus: org?.subscriptionStatus,
        daysUntilExpiration: org ? Math.ceil((new Date(org.subscriptionEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null,
      };
    } catch (error) {
      console.error('Error fetching organization stats:', error);
      return null;
    }
  }
}

export const organizationManager = new OrganizationManager();

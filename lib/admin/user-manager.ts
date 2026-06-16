import { query, execute, transaction } from '@/lib/db';
import { User, UserRole, UserStatus } from '@/types/admin';
import { auditLogger } from '@/lib/audit/audit-logger';
import { v4 as uuidv4 } from 'uuid';

export class UserManager {
  public async createUser(
    organizationId: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    createdBy: string,
    options?: {
      department?: string;
      teamId?: string;
    }
  ): Promise<User | null> {
    try {
      const userId = uuidv4();
      const now = new Date();

      const result = await execute(
        `INSERT INTO users (
          id, organization_id, email, first_name, last_name, role, status,
          department_id, team_id, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          userId,
          organizationId,
          email,
          firstName,
          lastName,
          role,
          'pending',
          options?.department || null,
          options?.teamId || null,
          now,
          now,
        ]
      );

      if (result > 0) {
        // Log the audit event
        await auditLogger.log(
          organizationId,
          'USER_CREATED',
          'warning',
          'user',
          userId,
          `${firstName} ${lastName}`,
          `User ${email} created with role ${role}`,
          {
            userId: createdBy,
            status: 'success',
          }
        );

        // Update user count
        await this.updateUserCount(organizationId);

        return {
          id: userId,
          email,
          firstName,
          lastName,
          role,
          status: 'pending',
          organizationId,
          twoFactorEnabled: false,
          createdAt: now,
          updatedAt: now,
        };
      }

      return null;
    } catch (error) {
      console.error('Error creating user:', error);
      await auditLogger.logAuthFailure(
        organizationId,
        email,
        '',
        `Failed to create user: ${error}`
      );
      return null;
    }
  }

  public async getUser(userId: string): Promise<User | null> {
    try {
      const result = await query<User>(
        `SELECT id, email, first_name as "firstName", last_name as "lastName", role,
         status, department_id as "department", team_id as "teamId", organization_id as "organizationId",
         two_factor_enabled as "twoFactorEnabled", last_login as "lastLogin",
         created_at as "createdAt", updated_at as "updatedAt"
         FROM users WHERE id = $1`,
        [userId]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  public async getUserByEmail(organizationId: string, email: string): Promise<User | null> {
    try {
      const result = await query<User>(
        `SELECT id, email, first_name as "firstName", last_name as "lastName", role,
         status, department_id as "department", team_id as "teamId", organization_id as "organizationId",
         two_factor_enabled as "twoFactorEnabled", last_login as "lastLogin",
         created_at as "createdAt", updated_at as "updatedAt"
         FROM users WHERE organization_id = $1 AND email = $2`,
        [organizationId, email]
      );

      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  public async listUsers(
    organizationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ users: User[]; total: number }> {
    try {
      const users = await query<User>(
        `SELECT id, email, first_name as "firstName", last_name as "lastName", role,
         status, department_id as "department", team_id as "teamId", organization_id as "organizationId",
         two_factor_enabled as "twoFactorEnabled", last_login as "lastLogin",
         created_at as "createdAt", updated_at as "updatedAt"
         FROM users WHERE organization_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [organizationId, limit, offset]
      );

      const countResult = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = $1',
        [organizationId]
      );

      const total = parseInt(countResult[0]?.count || '0', 10);

      return { users, total };
    } catch (error) {
      console.error('Error listing users:', error);
      return { users: [], total: 0 };
    }
  }

  public async updateUser(
    userId: string,
    organizationId: string,
    updates: {
      firstName?: string;
      lastName?: string;
      role?: UserRole;
      status?: UserStatus;
      department?: string;
      teamId?: string;
    },
    updatedBy: string
  ): Promise<User | null> {
    try {
      const user = await this.getUser(userId);
      if (!user) return null;

      const changes: Record<string, { before: any; after: any }> = {};
      const fields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.firstName && updates.firstName !== user.firstName) {
        changes['firstName'] = { before: user.firstName, after: updates.firstName };
        fields.push(`first_name = $${paramIndex++}`);
        values.push(updates.firstName);
      }

      if (updates.lastName && updates.lastName !== user.lastName) {
        changes['lastName'] = { before: user.lastName, after: updates.lastName };
        fields.push(`last_name = $${paramIndex++}`);
        values.push(updates.lastName);
      }

      if (updates.role && updates.role !== user.role) {
        changes['role'] = { before: user.role, after: updates.role };
        fields.push(`role = $${paramIndex++}`);
        values.push(updates.role);
      }

      if (updates.status && updates.status !== user.status) {
        changes['status'] = { before: user.status, after: updates.status };
        fields.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }

      if (fields.length === 0) return user;

      fields.push(`updated_at = $${paramIndex++}`);
      values.push(new Date());
      values.push(userId);

      const result = await execute(
        `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'USER_UPDATED',
          'warning',
          'user',
          userId,
          user.email,
          'User details updated',
          {
            userId: updatedBy,
            changes: Object.keys(changes).length > 0 ? changes : undefined,
            status: 'success',
          }
        );

        return this.getUser(userId);
      }

      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  public async deleteUser(userId: string, organizationId: string, deletedBy: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user) return false;

      const result = await execute('DELETE FROM users WHERE id = $1', [userId]);

      if (result > 0) {
        await auditLogger.log(
          organizationId,
          'USER_DELETED',
          'critical',
          'user',
          userId,
          user.email,
          'User deleted from system',
          {
            userId: deletedBy,
            status: 'success',
          }
        );

        await this.updateUserCount(organizationId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  public async bulkImportUsers(
    organizationId: string,
    users: Array<{
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      department?: string;
    }>,
    importedBy: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    for (const userData of users) {
      try {
        const result = await this.createUser(
          organizationId,
          userData.email,
          userData.firstName,
          userData.lastName,
          userData.role,
          importedBy,
          { department: userData.department }
        );

        if (result) {
          success++;
        } else {
          failed++;
          errors.push(`Failed to create user: ${userData.email}`);
        }
      } catch (error) {
        failed++;
        errors.push(`Error creating user ${userData.email}: ${error}`);
      }
    }

    await auditLogger.log(
      organizationId,
      'BULK_OPERATION',
      'warning',
      'user',
      organizationId,
      'Bulk User Import',
      `Bulk imported ${success} users, ${failed} failed`,
      {
        userId: importedBy,
        metadata: { success, failed, totalAttempted: users.length },
        status: failed > 0 ? 'failure' : 'success',
      }
    );

    return { success, failed, errors };
  }

  public async updateUserCount(organizationId: string): Promise<void> {
    try {
      const result = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND status = $2',
        [organizationId, 'active']
      );

      const count = parseInt(result[0]?.count || '0', 10);

      await execute(
        'UPDATE organizations SET current_user_count = $1 WHERE id = $2',
        [count, organizationId]
      );
    } catch (error) {
      console.error('Error updating user count:', error);
    }
  }

  public async enableTwoFactor(userId: string, secret: string): Promise<boolean> {
    try {
      const result = await execute(
        'UPDATE users SET two_factor_enabled = true, two_factor_secret = $1 WHERE id = $2',
        [secret, userId]
      );

      return result > 0;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return false;
    }
  }

  public async getStats(organizationId: string): Promise<any> {
    try {
      const totalUsers = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = $1',
        [organizationId]
      );

      const activeUsers = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND status = $2',
        [organizationId, 'active']
      );

      const twoFactorEnabled = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND two_factor_enabled = true',
        [organizationId]
      );

      return {
        totalUsers: parseInt(totalUsers[0]?.count || '0', 10),
        activeUsers: parseInt(activeUsers[0]?.count || '0', 10),
        twoFactorEnabledUsers: parseInt(twoFactorEnabled[0]?.count || '0', 10),
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { totalUsers: 0, activeUsers: 0, twoFactorEnabledUsers: 0 };
    }
  }
}

export const userManager = new UserManager();

import { NextResponse } from 'next/server';
import { userManager } from '@/lib/admin/user-manager';
import { organizationManager } from '@/lib/admin/organization-manager';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get user stats
    const userStats = await userManager.getStats('org-default');

    // Get organization count
    const orgCount = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM organizations'
    );

    // Get policy count
    const policyCount = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM security_policies'
    );

    // Get recent audit logs
    const recentLogs = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM audit_logs WHERE created_at > NOW() - INTERVAL '7 days'`
    );

    // Get security alerts
    const alerts = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM threat_events WHERE resolved = false`
    );

    return NextResponse.json({
      totalUsers: userStats.totalUsers,
      activeUsers: userStats.activeUsers,
      twoFactorEnabled: userStats.twoFactorEnabledUsers,
      totalOrganizations: parseInt(orgCount[0]?.count || '0', 10),
      totalPolicies: parseInt(policyCount[0]?.count || '0', 10),
      recentAuditLogs: parseInt(recentLogs[0]?.count || '0', 10),
      securityAlerts: parseInt(alerts[0]?.count || '0', 10),
      systemHealth: {
        status: 'healthy',
        databaseStatus: 'connected',
        lastCheckTime: new Date(),
        uptime: Math.floor(process.uptime()),
        errorRate: 0.2,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit/audit-logger';
import { AuditLogQuery } from '@/types/audit';

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id') || 'org-default';
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const query: AuditLogQuery = {
      organizationId,
      limit,
      offset,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    const { logs, total } = await auditLogger.getLogs(query);

    return NextResponse.json({ logs, total });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

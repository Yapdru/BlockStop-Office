import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit/audit-logger';

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id') || 'org-default';
    const format = request.nextUrl.searchParams.get('format') as 'csv' | 'json' || 'json';
    const startDate = request.nextUrl.searchParams.get('startDate');
    const endDate = request.nextUrl.searchParams.get('endDate');

    const exportData = await auditLogger.exportLogs(
      organizationId,
      format,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    if (!exportData) {
      return NextResponse.json(
        { error: 'Failed to export logs' },
        { status: 500 }
      );
    }

    const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
    const filename = `audit-logs.${format}`;

    return new NextResponse(exportData, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to export audit logs' },
      { status: 500 }
    );
  }
}

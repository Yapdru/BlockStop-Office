import { NextRequest, NextResponse } from 'next/server';
import { organizationManager } from '@/lib/admin/organization-manager';

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id') || 'org-default';

    const settings = await organizationManager.getOrganizationSettings(organizationId);

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id') || 'org-default';
    const userId = request.headers.get('x-user-id') || 'system';
    const body = await request.json();

    const settings = await organizationManager.updateOrganizationSettings(
      organizationId,
      body,
      userId
    );

    if (!settings) {
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

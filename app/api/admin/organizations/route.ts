import { NextRequest, NextResponse } from 'next/server';
import { organizationManager } from '@/lib/admin/organization-manager';

export async function GET(request: NextRequest) {
  try {
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const { organizations, total } = await organizationManager.listOrganizations(limit, offset);

    return NextResponse.json({ organizations, total });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id') || 'system';
    const body = await request.json();

    const { name, displayName, domain, subscriptionTier, description } = body;

    if (!name || !displayName || !domain || !subscriptionTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const organization = await organizationManager.createOrganization(
      name,
      displayName,
      domain,
      subscriptionTier,
      userId,
      description
    );

    if (!organization) {
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}

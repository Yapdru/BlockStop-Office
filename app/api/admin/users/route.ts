import { NextRequest, NextResponse } from 'next/server';
import { userManager } from '@/lib/admin/user-manager';
import { auditLogger } from '@/lib/audit/audit-logger';

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id') || 'org-default';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

    const { users, total } = await userManager.listUsers(organizationId, limit, offset);

    return NextResponse.json({ users, total });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id') || 'org-default';
    const userId = request.headers.get('x-user-id') || 'system';
    const body = await request.json();

    const { email, firstName, lastName, role, department, teamId } = body;

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const user = await userManager.createUser(
      organizationId,
      email,
      firstName,
      lastName,
      role,
      userId,
      { department, teamId }
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

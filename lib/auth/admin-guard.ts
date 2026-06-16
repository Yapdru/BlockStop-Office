import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name?: string;
    role: 'admin' | 'manager' | 'user';
    organizationId: string;
  };
  expires: string;
}

export async function getSession(): Promise<AuthSession | null> {
  try {
    const session = await getServerSession();
    return session as AuthSession | null;
  } catch {
    return null;
  }
}

export async function verifyAdminAccess(userId: string): Promise<boolean> {
  try {
    const user = await query<{ role: string }>(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );
    return user.length > 0 && user[0].role === 'admin';
  } catch (error) {
    console.error('Error verifying admin access:', error);
    return false;
  }
}

export async function verifyManagerAccess(userId: string): Promise<boolean> {
  try {
    const user = await query<{ role: string }>(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );
    return user.length > 0 && ['admin', 'manager'].includes(user[0].role);
  } catch (error) {
    console.error('Error verifying manager access:', error);
    return false;
  }
}

export function adminGuardMiddleware(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await verifyAdminAccess(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, ...args);
  };
}

export function managerGuardMiddleware(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await verifyManagerAccess(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return handler(req, ...args);
  };
}

export function requireAuth(handler: any) {
  return async (req: NextRequest, ...args: any[]) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, ...args);
  };
}

export async function hasPermission(userId: string, organizationId: string): Promise<boolean> {
  try {
    const result = await query<{ id: string }>(
      `SELECT id FROM users WHERE id = $1 AND organization_id = $2`,
      [userId, organizationId]
    );
    return result.length > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

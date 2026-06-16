import { NextRequest, NextResponse } from 'next/server';
import { policyManager } from '@/lib/admin/policy-manager';

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id') || 'org-default';
    const policyType = request.nextUrl.searchParams.get('type');

    let policies: any[] = [];

    if (policyType === 'security') {
      policies = await policyManager.listSecurityPolicies(organizationId);
    } else if (policyType === 'vpn') {
      policies = await policyManager.listVPNPolicies(organizationId);
    } else if (policyType === 'scan') {
      policies = await policyManager.listScanPolicies(organizationId);
    } else if (policyType === 'dlp') {
      policies = await policyManager.listDLPRules(organizationId);
    } else {
      // Return all policy types
      const [security, vpn, scan, dlp] = await Promise.all([
        policyManager.listSecurityPolicies(organizationId),
        policyManager.listVPNPolicies(organizationId),
        policyManager.listScanPolicies(organizationId),
        policyManager.listDLPRules(organizationId),
      ]);
      policies = [...security, ...vpn, ...scan, ...dlp];
    }

    return NextResponse.json({ policies });
  } catch (error) {
    console.error('Error fetching policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch policies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('x-organization-id') || 'org-default';
    const userId = request.headers.get('x-user-id') || 'system';
    const body = await request.json();

    const { type, name, description, ...rest } = body;

    if (!type || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let policy = null;

    switch (type) {
      case 'security': {
        const { policyType, settings } = rest;
        policy = await policyManager.createSecurityPolicy(
          organizationId,
          name,
          policyType,
          settings,
          userId,
          description
        );
        break;
      }
      case 'vpn': {
        const { allowedProviders, dataUsageLimitGb, settings } = rest;
        policy = await policyManager.createVPNPolicy(
          organizationId,
          name,
          allowedProviders,
          userId,
          { description, dataUsageLimitGb, settings }
        );
        break;
      }
      case 'scan': {
        const { scanFrequency, schedule, settings } = rest;
        policy = await policyManager.createScanPolicy(
          organizationId,
          name,
          scanFrequency,
          userId,
          { description, schedule, settings }
        );
        break;
      }
      case 'dlp': {
        const { pattern, action, severity, settings } = rest;
        policy = await policyManager.createDLPRule(
          organizationId,
          name,
          action,
          severity,
          userId,
          { description, pattern, settings }
        );
        break;
      }
      default:
        return NextResponse.json(
          { error: 'Invalid policy type' },
          { status: 400 }
        );
    }

    if (!policy) {
      return NextResponse.json(
        { error: 'Failed to create policy' },
        { status: 500 }
      );
    }

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Error creating policy:', error);
    return NextResponse.json(
      { error: 'Failed to create policy' },
      { status: 500 }
    );
  }
}

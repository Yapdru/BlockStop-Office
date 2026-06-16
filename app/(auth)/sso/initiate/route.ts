import { NextRequest, NextResponse } from 'next/server';
import { ssoService } from '@/lib/auth/sso-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider || request.nextUrl.searchParams.get('provider');
    if (!provider) {
      return NextResponse.json({ error: 'Provider not specified' }, { status: 400 });
    }

    const redirectUri = `${process.env.NEXTAUTH_URL}/auth/sso/callback?provider=${provider}`;
    const state = ssoService.generateState();

    const authUrl = ssoService.generateAuthorizationUrl(provider, redirectUri, state);

    if (!authUrl) {
      return NextResponse.json({ error: 'Provider not configured' }, { status: 400 });
    }

    // Store state in session/cookie for verification
    const response = NextResponse.redirect(authUrl);
    response.cookies.set('sso_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('SSO initiation error:', error);
    return NextResponse.json({ error: 'Failed to initiate SSO' }, { status: 500 });
  }
}

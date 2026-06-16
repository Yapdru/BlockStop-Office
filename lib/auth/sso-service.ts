import crypto from 'crypto';

export interface SAMLConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

export class SSOService {
  private samlConfig: SAMLConfig | null = null;
  private oauthConfigs: Map<string, OAuthConfig> = new Map();

  constructor() {
    this.initializeSAML();
    this.initializeOAuth();
  }

  private initializeSAML(): void {
    if (
      process.env.SAML_ENTRY_POINT &&
      process.env.SAML_ISSUER &&
      process.env.SAML_CERT
    ) {
      this.samlConfig = {
        entryPoint: process.env.SAML_ENTRY_POINT,
        issuer: process.env.SAML_ISSUER,
        cert: process.env.SAML_CERT,
      };
    }
  }

  private initializeOAuth(): void {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      this.oauthConfigs.set('google', {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      });
    }

    if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
      this.oauthConfigs.set('microsoft', {
        clientId: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        authorizeUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
      });
    }
  }

  public getSAMLConfig(): SAMLConfig | null {
    return this.samlConfig;
  }

  public getOAuthConfig(provider: string): OAuthConfig | null {
    return this.oauthConfigs.get(provider.toLowerCase()) || null;
  }

  public generateAuthorizationUrl(
    provider: string,
    redirectUri: string,
    state: string
  ): string | null {
    const config = this.getOAuthConfig(provider);
    if (!config) return null;

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: this.getScopes(provider),
      state,
    });

    return `${config.authorizeUrl}?${params.toString()}`;
  }

  public async exchangeCodeForToken(
    provider: string,
    code: string,
    redirectUri: string
  ): Promise<{ accessToken: string; idToken?: string } | null> {
    const config = this.getOAuthConfig(provider);
    if (!config) return null;

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: config.clientId,
          client_secret: config.clientSecret,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        accessToken: data.access_token,
        idToken: data.id_token,
      };
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return null;
    }
  }

  public async getUserInfo(
    provider: string,
    accessToken: string
  ): Promise<any | null> {
    const config = this.getOAuthConfig(provider);
    if (!config) return null;

    try {
      const response = await fetch(config.userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`User info request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  public generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  public generateCodeChallenge(): { challenge: string; verifier: string } {
    const verifier = crypto.randomBytes(32).toString('hex');
    const challenge = crypto
      .createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return { challenge, verifier };
  }

  private getScopes(provider: string): string {
    const scopes: Record<string, string> = {
      google: 'openid email profile',
      microsoft: 'openid email profile',
    };
    return scopes[provider.toLowerCase()] || 'openid email profile';
  }
}

export const ssoService = new SSOService();

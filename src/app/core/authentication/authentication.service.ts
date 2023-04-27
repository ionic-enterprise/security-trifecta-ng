import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { AuthConnect, AuthResult, CognitoProvider, TokenType } from '@ionic-enterprise/auth';
import { Platform } from '@ionic/angular';
import { SessionVaultService } from '../session-vault/session-vault.service';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  initializing: Promise<void> | undefined;

  private provider: CognitoProvider;
  private isMobile: boolean;

  constructor(platform: Platform, private sessionVault: SessionVaultService) {
    this.provider = new CognitoProvider();
    this.isMobile = platform.is('hybrid');
  }

  async login(): Promise<void> {
    await this.initialize();
    const authResult = await AuthConnect.login(
      this.provider,
      this.isMobile ? environment.mobileAuthConfig : environment.webAuthConfig
    );
    this.sessionVault.setSession(authResult);
  }

  async logout(): Promise<void> {
    await this.initialize();
    const authResult = await this.sessionVault.getSession();
    if (authResult) {
      await AuthConnect.logout(this.provider, authResult);
      await this.sessionVault.clearSession();
    }
  }

  async isAuthenticated(): Promise<boolean> {
    await this.initialize();
    return !!(await this.getAuthResult());
  }

  async getAccessToken(): Promise<string | void> {
    await this.initialize();
    const authResult = await this.getAuthResult();
    return authResult?.accessToken;
  }

  async getUserEmail(): Promise<string | void> {
    await this.initialize();
    const authResult = await this.sessionVault.getSession();
    if (authResult) {
      const { email } = (await AuthConnect.decodeToken(TokenType.id, authResult)) as { email?: string };
      return email;
    }
  }

  private async initialize(): Promise<void> {
    if (!this.initializing) {
      this.initializing = new Promise((resolve) => {
        this.performInit().then(() => resolve());
      });
    }
    return this.initializing;
  }

  private async performInit(): Promise<void> {
    await AuthConnect.setup({
      platform: this.isMobile ? 'capacitor' : 'web',
      logLevel: 'DEBUG',
      ios: {
        webView: 'private',
      },
      web: {
        uiMode: 'popup',
        authFlow: 'PKCE',
      },
    });
  }

  private async performRefresh(authResult: AuthResult): Promise<AuthResult | undefined> {
    let newAuthResult: AuthResult | undefined;

    if (await AuthConnect.isRefreshTokenAvailable(authResult)) {
      try {
        newAuthResult = await AuthConnect.refreshSession(this.provider, authResult);
        this.sessionVault.setSession(newAuthResult);
      } catch (err) {
        await this.sessionVault.clearSession();
      }
    } else {
      await this.sessionVault.clearSession();
    }

    return newAuthResult;
  }

  private async getAuthResult(): Promise<AuthResult | null | undefined> {
    let authResult = await this.sessionVault.getSession();
    if (authResult && (await AuthConnect.isAccessTokenExpired(authResult))) {
      authResult = await this.performRefresh(authResult);
    }
    return authResult;
  }
}

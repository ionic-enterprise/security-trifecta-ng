import { TestBed } from '@angular/core/testing';
import { SessionVaultService } from '@app/core/session-vault/session-vault.service';
import { createSessionVaultServiceMock } from '@app/core/testing';
import { environment } from '@env/environment';
import { AuthConnect, AuthResult, CognitoProvider, TokenType } from '@ionic-enterprise/auth';
import { Platform } from '@ionic/angular';
import { createPlatformMock } from '@test/mocks';
import { AuthenticationService } from './authentication.service';

const refreshedAuthResult = {
  accessToken: 'refreshed-access-token',
  refreshToken: 'refreshed-refresh-token',
  idToken: 'refreshed-id-token',
};

const testAuthResult = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  idToken: 'test-id-token',
};

[true, false].forEach((isNative: boolean) => {
  describe(`OIDC Authentication Service on ${isNative ? 'native' : 'web'}`, () => {
    let service: AuthenticationService;

    beforeEach(() => {
      spyOn(AuthConnect, 'decodeToken').and.callFake(() => Promise.resolve(null));
      spyOn(AuthConnect, 'setup').and.callFake(() => Promise.resolve());
      const platform = createPlatformMock();
      (platform.is as jasmine.Spy).and.returnValue(isNative);
      TestBed.configureTestingModule({
        providers: [
          { provide: Platform, useValue: platform },
          { provide: SessionVaultService, useFactory: createSessionVaultServiceMock },
        ],
      });
      service = TestBed.inject(AuthenticationService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('login', () => {
      beforeEach(() => {
        spyOn(AuthConnect, 'login').and.callFake(() => Promise.resolve(testAuthResult as AuthResult));
      });

      it('initializes', async () => {
        await service.login();
        expect(AuthConnect.setup).toHaveBeenCalledTimes(1);
        expect(AuthConnect.setup).toHaveBeenCalledWith({
          platform: isNative ? 'capacitor' : 'web',
          logLevel: 'DEBUG',
          ios: {
            webView: 'private',
          },
          web: {
            uiMode: 'popup',
            authFlow: 'PKCE',
          },
        });
      });

      it('calls the auth connect login', async () => {
        await service.login();
        expect(AuthConnect.login).toHaveBeenCalledTimes(1);
        expect(AuthConnect.login).toHaveBeenCalledWith(
          jasmine.any(CognitoProvider),
          isNative ? environment.mobileAuthConfig : environment.webAuthConfig
        );
      });

      it('saves the auth result', async () => {
        const sessionVault = TestBed.inject(SessionVaultService);
        await service.login();
        expect(sessionVault.setSession).toHaveBeenCalledTimes(1);
        expect(sessionVault.setSession).toHaveBeenCalledWith(testAuthResult as AuthResult);
      });
    });

    describe('is authenticated', () => {
      beforeEach(() => {
        spyOn(AuthConnect, 'isAccessTokenExpired').and.callFake(() => Promise.resolve(false));
        spyOn(AuthConnect, 'isRefreshTokenAvailable').and.callFake(() => Promise.resolve(false));
        spyOn(AuthConnect, 'refreshSession').and.callFake(() => Promise.resolve(refreshedAuthResult as AuthResult));
      });

      it('initializes', async () => {
        await service.isAuthenticated();
        expect(AuthConnect.setup).toHaveBeenCalledTimes(1);
        expect(AuthConnect.setup).toHaveBeenCalledWith({
          platform: isNative ? 'capacitor' : 'web',
          logLevel: 'DEBUG',
          ios: {
            webView: 'private',
          },
          web: {
            uiMode: 'popup',
            authFlow: 'PKCE',
          },
        });
      });

      describe('if there is no auth result', () => {
        beforeEach(() => {
          const sessionVault = TestBed.inject(SessionVaultService);
          (sessionVault.getSession as jasmine.Spy).and.resolveTo(null);
        });

        it('does not check for an expired access token', async () => {
          await service.isAuthenticated();
          expect(AuthConnect.isAccessTokenExpired).not.toHaveBeenCalled();
        });

        it('resolves false ', async () => {
          expect(await service.isAuthenticated()).toBe(false);
        });
      });

      describe('if there is an auth result', () => {
        beforeEach(() => {
          const sessionVault = TestBed.inject(SessionVaultService);
          (sessionVault.getSession as jasmine.Spy).and.resolveTo(testAuthResult);
        });

        describe('if the access token is not expired', () => {
          beforeEach(() => {
            (AuthConnect.isAccessTokenExpired as jasmine.Spy).and.resolveTo(false);
          });

          it('resolves true', async () => {
            expect(await service.isAuthenticated()).toBe(true);
          });
        });

        describe('if the access token is expired', () => {
          beforeEach(() => {
            (AuthConnect.isAccessTokenExpired as jasmine.Spy).and.resolveTo(true);
          });

          describe('if a refresh token exists', () => {
            beforeEach(() => {
              (AuthConnect.isRefreshTokenAvailable as jasmine.Spy).and.resolveTo(true);
            });

            it('attempts a refresh', async () => {
              await service.isAuthenticated();
              expect(AuthConnect.refreshSession).toHaveBeenCalledTimes(1);
              expect(AuthConnect.refreshSession).toHaveBeenCalledWith(
                jasmine.any(CognitoProvider),
                testAuthResult as AuthResult
              );
            });

            describe('when the refresh is successful', () => {
              beforeEach(() => {
                (AuthConnect.refreshSession as jasmine.Spy).and.resolveTo(refreshedAuthResult);
              });

              it('saves the new auth result', async () => {
                const sessionVault = TestBed.inject(SessionVaultService);
                await service.isAuthenticated();
                expect(sessionVault.setSession).toHaveBeenCalledTimes(1);
                expect(sessionVault.setSession).toHaveBeenCalledWith(refreshedAuthResult as AuthResult);
              });

              it('resolves true', async () => {
                expect(await service.isAuthenticated()).toBe(true);
              });
            });

            describe('when the refresh fails', () => {
              beforeEach(() => {
                (AuthConnect.refreshSession as jasmine.Spy).and.rejectWith(new Error('refresh failed'));
              });

              it('clears the vault', async () => {
                const sessionVault = TestBed.inject(SessionVaultService);
                await service.isAuthenticated();
                expect(sessionVault.clearSession).toHaveBeenCalledTimes(1);
              });

              it('resolves false', async () => {
                expect(await service.isAuthenticated()).toBe(false);
              });
            });
          });

          describe('if a refresh token does not exist', () => {
            beforeEach(() => {
              (AuthConnect.isRefreshTokenAvailable as jasmine.Spy).and.resolveTo(false);
            });

            it('it does not attempt a refresh', async () => {
              await service.isAuthenticated();
              expect(AuthConnect.refreshSession).not.toHaveBeenCalled();
            });

            it('clears the vault', async () => {
              const sessionVault = TestBed.inject(SessionVaultService);
              await service.isAuthenticated();
              expect(sessionVault.clearSession).toHaveBeenCalledTimes(1);
            });

            it('resolves false', async () => {
              expect(await service.isAuthenticated()).toBe(false);
            });
          });
        });
      });
    });

    describe('get access token', () => {
      beforeEach(() => {
        spyOn(AuthConnect, 'isAccessTokenExpired').and.callFake(() => Promise.resolve(false));
        spyOn(AuthConnect, 'refreshSession').and.callFake(() => Promise.resolve(refreshedAuthResult as AuthResult));
        spyOn(AuthConnect, 'isRefreshTokenAvailable').and.callFake(() => Promise.resolve(true));
      });

      it('initializes', async () => {
        await service.getAccessToken();
        expect(AuthConnect.setup).toHaveBeenCalledTimes(1);
        expect(AuthConnect.setup).toHaveBeenCalledWith({
          platform: isNative ? 'capacitor' : 'web',
          logLevel: 'DEBUG',
          ios: {
            webView: 'private',
          },
          web: {
            uiMode: 'popup',
            authFlow: 'PKCE',
          },
        });
      });

      describe('if there is no auth result', () => {
        beforeEach(() => {
          const sessionVault = TestBed.inject(SessionVaultService);
          (sessionVault.getSession as jasmine.Spy).and.resolveTo(null);
        });

        it('does not check for an expired access token', async () => {
          await service.getAccessToken();
          expect(AuthConnect.isAccessTokenExpired).not.toHaveBeenCalled();
        });

        it('resolves undefined ', async () => {
          expect(await service.getAccessToken()).toBeUndefined();
        });
      });

      describe('if there is an auth result', () => {
        beforeEach(() => {
          const sessionVault = TestBed.inject(SessionVaultService);
          (sessionVault.getSession as jasmine.Spy).and.resolveTo(testAuthResult);
        });

        describe('if the access token is not expired', () => {
          beforeEach(() => {
            (AuthConnect.isAccessTokenExpired as jasmine.Spy).and.resolveTo(false);
          });

          it('resolves the access token', async () => {
            expect(await service.getAccessToken()).toBe(testAuthResult.accessToken);
          });
        });

        describe('if the access token is expired', () => {
          beforeEach(() => {
            (AuthConnect.isAccessTokenExpired as jasmine.Spy).and.resolveTo(true);
          });

          describe('if a refresh token exists', () => {
            beforeEach(() => {
              (AuthConnect.isRefreshTokenAvailable as jasmine.Spy).and.resolveTo(true);
            });

            it('attempts a refresh', async () => {
              await service.getAccessToken();
              expect(AuthConnect.refreshSession).toHaveBeenCalledTimes(1);
              expect(AuthConnect.refreshSession).toHaveBeenCalledWith(
                jasmine.any(CognitoProvider),
                testAuthResult as AuthResult
              );
            });

            describe('when the refresh is successful', () => {
              beforeEach(() => {
                (AuthConnect.refreshSession as jasmine.Spy).and.resolveTo(refreshedAuthResult as AuthResult);
              });

              it('saves the new auth result', async () => {
                const sessionVault = TestBed.inject(SessionVaultService);
                await service.getAccessToken();
                expect(sessionVault.setSession).toHaveBeenCalledTimes(1);
                expect(sessionVault.setSession).toHaveBeenCalledWith(refreshedAuthResult as AuthResult);
              });

              it('resolves the new token', async () => {
                expect(await service.getAccessToken()).toEqual(refreshedAuthResult.accessToken);
              });
            });

            describe('when the refresh fails', () => {
              beforeEach(() => {
                (AuthConnect.refreshSession as jasmine.Spy).and.rejectWith(new Error('refresh failed'));
              });

              it('clears the vault', async () => {
                const sessionVault = TestBed.inject(SessionVaultService);
                await service.getAccessToken();
                expect(sessionVault.clearSession).toHaveBeenCalledTimes(1);
              });

              it('resolves undefined', async () => {
                expect(await service.getAccessToken()).toBeUndefined();
              });
            });
          });

          describe('if a refresh token does not exist', () => {
            beforeEach(() => {
              (AuthConnect.isRefreshTokenAvailable as jasmine.Spy).and.resolveTo(false);
            });

            it('it does not attempt a refresh', async () => {
              await service.getAccessToken();
              expect(AuthConnect.refreshSession).not.toHaveBeenCalled();
            });

            it('clears the vault', async () => {
              const sessionVault = TestBed.inject(SessionVaultService);
              await service.getAccessToken();
              expect(sessionVault.clearSession).toHaveBeenCalledTimes(1);
            });

            it('resolves undefined', async () => {
              expect(await service.getAccessToken()).toBeUndefined();
            });
          });
        });
      });
    });

    describe('get user email', () => {
      beforeEach(() => {
        (AuthConnect.decodeToken as jasmine.Spy).and.resolveTo({ email: 'test@testy.com' });
      });

      it('initializes', async () => {
        await service.getUserEmail();
        expect(AuthConnect.setup).toHaveBeenCalledTimes(1);
        expect(AuthConnect.setup).toHaveBeenCalledWith({
          platform: isNative ? 'capacitor' : 'web',
          logLevel: 'DEBUG',
          ios: {
            webView: 'private',
          },
          web: {
            uiMode: 'popup',
            authFlow: 'PKCE',
          },
        });
      });

      it('gets the auth result', async () => {
        const sessionVault = TestBed.inject(SessionVaultService);
        await service.getUserEmail();
        expect(sessionVault.getSession).toHaveBeenCalledTimes(1);
      });

      describe('when there is no auth result', () => {
        beforeEach(() => {
          const sessionVault = TestBed.inject(SessionVaultService);
          (sessionVault.getSession as jasmine.Spy).and.resolveTo(undefined);
        });

        it('resolves undefined', async () => {
          expect(await service.getUserEmail()).toBeUndefined();
        });
      });

      describe('when there is an auth result', () => {
        beforeEach(() => {
          const sessionVault = TestBed.inject(SessionVaultService);
          (sessionVault.getSession as jasmine.Spy).and.resolveTo(testAuthResult as AuthResult);
        });

        it('calls the decodeToken', async () => {
          await service.getUserEmail();
          expect(AuthConnect.decodeToken).toHaveBeenCalledTimes(1);
          expect(AuthConnect.decodeToken).toHaveBeenCalledWith(TokenType.id, testAuthResult as AuthResult);
        });

        it('resolves the email value', async () => {
          expect(await service.getUserEmail()).toEqual('test@testy.com');
        });
      });
    });

    describe('logout', () => {
      beforeEach(() => {
        spyOn(AuthConnect, 'logout').and.callFake(() => Promise.resolve());
        spyOn(AuthConnect, 'isAccessTokenExpired').and.callFake(() => Promise.resolve(false));
        spyOn(AuthConnect, 'isRefreshTokenAvailable').and.callFake(() => Promise.resolve(true));
      });

      it('initializes', async () => {
        await service.logout();
        expect(AuthConnect.setup).toHaveBeenCalledTimes(1);
        expect(AuthConnect.setup).toHaveBeenCalledWith({
          platform: isNative ? 'capacitor' : 'web',
          logLevel: 'DEBUG',
          ios: {
            webView: 'private',
          },
          web: {
            uiMode: 'popup',
            authFlow: 'PKCE',
          },
        });
      });

      it('gets the current auth result', async () => {
        const sessionVault = TestBed.inject(SessionVaultService);
        await service.logout();
        expect(sessionVault.getSession).toHaveBeenCalledTimes(1);
      });

      describe('if there is no auth result', () => {
        beforeEach(() => {
          const sessionVault = TestBed.inject(SessionVaultService);
          (sessionVault.getSession as jasmine.Spy).and.resolveTo(undefined);
        });

        it('does not call logout ', async () => {
          await service.logout();
          expect(AuthConnect.logout).not.toHaveBeenCalled();
        });
      });

      describe('if there is an auth result', () => {
        beforeEach(() => {
          const sessionVault = TestBed.inject(SessionVaultService);
          (AuthConnect.isAccessTokenExpired as jasmine.Spy).and.resolveTo(false);
          (sessionVault.getSession as jasmine.Spy).and.resolveTo(testAuthResult as AuthResult);
        });

        it('calls logout ', async () => {
          await service.logout();
          expect(AuthConnect.logout).toHaveBeenCalledTimes(1);
          expect(AuthConnect.logout).toHaveBeenCalledWith(jasmine.any(CognitoProvider), testAuthResult as AuthResult);
        });

        it('clears the auth result', async () => {
          const sessionVault = TestBed.inject(SessionVaultService);
          await service.logout();
          expect(sessionVault.clearSession).toHaveBeenCalledTimes(1);
        });
      });
    });
  });
});

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SessionVaultService, SyncService } from '@app/core';
import { createSessionVaultServiceMock, createSyncServiceMock } from '@app/core/testing';
import { IonicModule, NavController } from '@ionic/angular';
import { createNavControllerMock } from '@test/mocks';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage, HttpClientTestingModule, IonicModule],
    })
      .overrideProvider(NavController, { useFactory: createNavControllerMock })
      .overrideProvider(SessionVaultService, { useFactory: createSessionVaultServiceMock })
      .overrideProvider(SyncService, { useFactory: createSyncServiceMock })
      .compileComponents();
  });

  const buildComponent = (sessionIsLocked: boolean) => {
    const vault = TestBed.inject(SessionVaultService);
    (vault.sessionIsLocked as jasmine.Spy).and.resolveTo(sessionIsLocked);
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('when the session is not locked', () => {
    beforeEach(waitForAsync(() => buildComponent(false)));

    it('displays the login card', () => {
      fixture.detectChanges();
      const login = fixture.debugElement.query(By.css('[data-testid="login-card"]'));
      const unlock = fixture.debugElement.query(By.css('[data-testid="unlock-card"]'));
      expect(login).toBeTruthy();
      expect(unlock).toBeNull();
    });

    describe('on successful login', () => {
      beforeEach(() => fixture.detectChanges());

      it('performs a sync', fakeAsync(() => {
        const sync = TestBed.inject(SyncService);
        const card = fixture.debugElement.query(By.css('[data-testid="login-card"]'));
        card.triggerEventHandler('loginSuccess');
        tick();
        expect(sync.execute).toHaveBeenCalledTimes(1);
      }));

      it('navigates to the main page', fakeAsync(() => {
        const nav = TestBed.inject(NavController);
        const card = fixture.debugElement.query(By.css('[data-testid="login-card"]'));
        card.triggerEventHandler('loginSuccess');
        tick();
        expect(nav.navigateRoot).toHaveBeenCalledTimes(1);
        expect(nav.navigateRoot).toHaveBeenCalledWith(['/', 'tasting-notes']);
      }));
    });
  });

  describe('when the session is locked', () => {
    beforeEach(waitForAsync(() => buildComponent(true)));

    it('displays the unlock card', () => {
      fixture.detectChanges();
      const login = fixture.debugElement.query(By.css('[data-testid="login-card"]'));
      const unlock = fixture.debugElement.query(By.css('[data-testid="unlock-card"]'));
      expect(login).toBeNull();
      expect(unlock).toBeTruthy();
    });

    describe('on unlock', () => {
      beforeEach(() => fixture.detectChanges());

      it('navigates to the main route', fakeAsync(() => {
        const nav = TestBed.inject(NavController);
        const card = fixture.debugElement.query(By.css('[data-testid="unlock-card"]'));
        card.triggerEventHandler('unlock');
        tick();
        expect(nav.navigateRoot).toHaveBeenCalledTimes(1);
        expect(nav.navigateRoot).toHaveBeenCalledWith(['/', 'tasting-notes']);
      }));
    });

    describe('on vault cleared', () => {
      beforeEach(() => fixture.detectChanges());

      it('displays the login card', () => {
        let unlockCard = fixture.debugElement.query(By.css('[data-testid="unlock-card"]'));
        unlockCard.triggerEventHandler('vaultClear');
        fixture.detectChanges();
        unlockCard = fixture.debugElement.query(By.css('[data-testid="unlock-card"]'));
        const loginCard = fixture.debugElement.query(By.css('[data-testid="login-card"]'));
        expect(loginCard).toBeTruthy();
        expect(unlockCard).toBeNull();
      });
    });
  });
});

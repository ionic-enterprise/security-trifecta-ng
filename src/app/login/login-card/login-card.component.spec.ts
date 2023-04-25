import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AuthenticationService, SessionVaultService } from '@app/core';
import { createAuthenticationServiceMock, createSessionVaultServiceMock } from '@app/core/testing';
import { click, setInputValue } from '@test/util';
import { of } from 'rxjs';

import { LoginCardComponent } from './login-card.component';

describe('LoginCardComponent', () => {
  let component: LoginCardComponent;
  let fixture: ComponentFixture<LoginCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [LoginCardComponent],
    })
      .overrideProvider(AuthenticationService, { useFactory: createAuthenticationServiceMock })
      .overrideProvider(SessionVaultService, { useFactory: createSessionVaultServiceMock })
      .compileComponents();

    fixture = TestBed.createComponent(LoginCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('renders', () => {
    expect(component).toBeTruthy();
  });

  it('displays the title properly', () => {
    const title = fixture.debugElement.query(By.css('ion-card-title'));
    expect(title.nativeElement.textContent.trim()).toBe('Login');
  });

  describe('signin button', () => {
    let button: HTMLIonButtonElement;
    beforeEach(() => {
      button = fixture.nativeElement.querySelector('ion-button');
    });

    describe('on click', () => {
      let errorDiv: HTMLDivElement;
      beforeEach(() => {
        errorDiv = fixture.nativeElement.querySelector('.error-message');
      });

      it('performs a login', fakeAsync(() => {
        const auth = TestBed.inject(AuthenticationService);
        click(fixture, button);
        tick();
        expect(auth.login).toHaveBeenCalledTimes(1);
      }));

      describe('when the login succeeds', () => {
        beforeEach(() => {
          const auth = TestBed.inject(AuthenticationService);
          (auth.login as jasmine.Spy).and.resolveTo(undefined);
        });

        it('initializes the vault type', fakeAsync(() => {
          const vault = TestBed.inject(SessionVaultService);
          click(fixture, button);
          tick();
          expect(vault.initializeUnlockMode).toHaveBeenCalledTimes(1);
        }));

        it('emits success', fakeAsync(() => {
          spyOn(component.loginSuccess, 'emit');
          click(fixture, button);
          tick();
          expect(component.loginSuccess.emit).toHaveBeenCalledTimes(1);
        }));
      });

      describe('when the login fails', () => {
        beforeEach(() => {
          const auth = TestBed.inject(AuthenticationService);
          (auth.login as jasmine.Spy).and.rejectWith(new Error('the login is a failure'));
        });

        it('displays a message', fakeAsync(() => {
          click(fixture, button);
          tick();
          fixture.detectChanges();
          expect(errorDiv.textContent.trim()).toBe('Invalid email or password');
        }));

        it('does not emit success', fakeAsync(() => {
          spyOn(component.loginSuccess, 'emit');
          click(fixture, button);
          tick();
          expect(component.loginSuccess.emit).not.toHaveBeenCalled();
        }));
      });
    });
  });
});

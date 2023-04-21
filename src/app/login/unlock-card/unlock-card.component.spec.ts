import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SessionVaultService } from '@app/core';
import { createSessionVaultServiceMock } from '@app/core/testing';
import { click } from '@test/util';

import { UnlockCardComponent } from './unlock-card.component';

describe('UnlockCardComponent', () => {
  let component: UnlockCardComponent;
  let fixture: ComponentFixture<UnlockCardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UnlockCardComponent],
    })
      .overrideProvider(SessionVaultService, { useFactory: createSessionVaultServiceMock })
      .compileComponents();

    fixture = TestBed.createComponent(UnlockCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('renders', () => {
    expect(component).toBeTruthy();
  });

  describe('clicking the signin button', () => {
    it('clears the vault', fakeAsync(() => {
      const vault = TestBed.inject(SessionVaultService);
      const button = fixture.debugElement.query(By.css('[data-testid="signin-button"]'));
      click(fixture, button.nativeElement);
      tick();
      expect(vault.clearSession).toHaveBeenCalledTimes(1);
    }));

    it('emits vault-cleared', fakeAsync(() => {
      spyOn(component.vaultClear, 'emit');
      const button = fixture.debugElement.query(By.css('[data-testid="signin-button"]'));
      click(fixture, button.nativeElement);
      tick();
      expect(component.vaultClear.emit).toHaveBeenCalledTimes(1);
    }));
  });

  describe('clicking the unlock button', () => {
    it('unlocks the vault', fakeAsync(() => {
      const vault = TestBed.inject(SessionVaultService);
      const button = fixture.debugElement.query(By.css('[data-testid="unlock-button"]'));
      click(fixture, button.nativeElement);
      tick();
      expect(vault.getSession).toHaveBeenCalledTimes(1);
    }));

    it('emits unlock', fakeAsync(() => {
      spyOn(component.unlock, 'emit');
      const button = fixture.debugElement.query(By.css('[data-testid="unlock-button"]'));
      click(fixture, button.nativeElement);
      tick();
      expect(component.unlock.emit).toHaveBeenCalledTimes(1);
    }));
  });
});

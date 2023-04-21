import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SplashScreen } from '@capacitor/splash-screen';
import { Device } from '@ionic-enterprise/identity-vault';
import { NavController } from '@ionic/angular';
import { createNavControllerMock } from '@test/mocks';
import { AppComponent } from './app.component';
import { PreferencesService, SessionVaultService } from './core';
import { createPreferencesServiceMock, createSessionVaultServiceMock } from './core/testing';

describe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [provideRouter([])],
    })
      .overrideProvider(NavController, { useFactory: createNavControllerMock })
      .overrideProvider(PreferencesService, { useFactory: createPreferencesServiceMock })
      .overrideProvider(SessionVaultService, { useFactory: createSessionVaultServiceMock })
      .compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it('hides the splash screen', () => {
    spyOn(SplashScreen, 'hide');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });

  it('set the privacy screen', () => {
    spyOn(Device, 'setHideScreenOnBackground');
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(Device.setHideScreenOnBackground).toHaveBeenCalledTimes(1);
    expect(Device.setHideScreenOnBackground).toHaveBeenCalledWith(true);
  });
});

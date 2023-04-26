import { TestBed } from '@angular/core/testing';
import { PinDialogComponent } from '@app/pin-dialog/pin-dialog.component';
import { AuthResult } from '@ionic-enterprise/auth';
import {
  BiometricPermissionState,
  Device,
  DeviceSecurityType,
  Vault,
  VaultType,
} from '@ionic-enterprise/identity-vault';
import { ModalController, Platform } from '@ionic/angular';
import { createOverlayControllerMock, createOverlayElementMock, createPlatformMock } from '@test/mocks';
import { VaultFactoryService } from '../vault-factory/vault-factory.service';
import { SessionVaultService } from './session-vault.service';

describe('SessionVaultService', () => {
  let modal: HTMLIonModalElement;
  let service: SessionVaultService;

  let onLockCallback: () => void;

  let onPasscodeRequestedCallback: (flag: boolean) => Promise<void>;
  let mockVault: Vault;
  let preferencesVault: Vault;

  beforeEach(() => {
    const vaultObject = {
      clear: Promise.resolve(),
      getKeys: Promise.resolve([]),
      getValue: Promise.resolve(),
      isEmpty: Promise.resolve(false),
      isLocked: Promise.resolve(false),
      lock: Promise.resolve(),
      setCustomPasscode: Promise.resolve(),
      setValue: Promise.resolve(),
      updateConfig: Promise.resolve(),
      unlock: Promise.resolve(),
      onLock: undefined,
      onUnlock: undefined,
      onPasscodeRequested: undefined,
    };
    preferencesVault = jasmine.createSpyObj<Vault>('PreferencesVault', { ...vaultObject });
    mockVault = jasmine.createSpyObj<Vault>('Vault', { ...vaultObject });
    (mockVault.onLock as any).and.callFake((callback: () => void) => (onLockCallback = callback));
    (mockVault.onPasscodeRequested as any).and.callFake(
      (callback: (flag: boolean) => Promise<void>) => (onPasscodeRequestedCallback = callback)
    );
    (mockVault.lock as any).and.callFake(() => onLockCallback());
    mockVault.config = {
      key: 'test',
      type: VaultType.SecureStorage,
      deviceSecurityType: DeviceSecurityType.None,
    };
    modal = createOverlayElementMock('Modal');
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ModalController,
          useValue: createOverlayControllerMock('ModalController', modal),
        },
        { provide: Platform, useFactory: createPlatformMock },
        {
          provide: VaultFactoryService,
          useValue: jasmine.createSpyObj('VaultFactoryService', {
            create: mockVault,
          }),
        },
      ],
    });
    service = TestBed.inject(SessionVaultService);
    const factory = TestBed.inject(VaultFactoryService);
    (factory.create as any)
      .withArgs({
        key: 'io.ionic.auth-playground-ng-preferences',
        type: VaultType.SecureStorage,
      })
      .and.returnValue(preferencesVault);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('reset unlock type', () => {
    it('updates the lock type to secure storage', async () => {
      const expectedConfig = {
        ...mockVault.config,
        type: VaultType.SecureStorage,
        deviceSecurityType: DeviceSecurityType.None,
      };
      await service.resetUnlockMode();
      expect(mockVault.updateConfig).toHaveBeenCalledTimes(1);
      expect(mockVault.updateConfig).toHaveBeenCalledWith(expectedConfig);
    });
  });
  describe('initialize unlock type', () => {
    describe('on mobile', () => {
      beforeEach(() => {
        const platform = TestBed.inject(Platform);
        (platform.is as any).withArgs('hybrid').and.returnValue(true);
      });

      it('uses a session PIN if no system PIN is set', async () => {
        spyOn(Device, 'isSystemPasscodeSet').and.returnValue(Promise.resolve(false));
        const expectedConfig = {
          ...mockVault.config,
          type: VaultType.CustomPasscode,
          deviceSecurityType: DeviceSecurityType.None,
        };
        await service.initializeUnlockMode();
        expect(mockVault.updateConfig).toHaveBeenCalledTimes(1);
        expect(mockVault.updateConfig).toHaveBeenCalledWith(expectedConfig);
      });

      it('uses device security if a system PIN is set and biometrics is enabled', async () => {
        spyOn(Device, 'isSystemPasscodeSet').and.returnValue(Promise.resolve(true));
        spyOn(Device, 'isBiometricsEnabled').and.returnValue(Promise.resolve(true));
        const expectedConfig = {
          ...mockVault.config,
          type: VaultType.DeviceSecurity,
          deviceSecurityType: DeviceSecurityType.Both,
        };
        await service.initializeUnlockMode();
        expect(mockVault.updateConfig).toHaveBeenCalledTimes(1);
        expect(mockVault.updateConfig).toHaveBeenCalledWith(expectedConfig);
      });

      it('uses device security if a system PIN is set and biometrics is not enabled', async () => {
        spyOn(Device, 'isSystemPasscodeSet').and.returnValue(Promise.resolve(true));
        spyOn(Device, 'isBiometricsEnabled').and.returnValue(Promise.resolve(false));
        const expectedConfig = {
          ...mockVault.config,
          type: VaultType.DeviceSecurity,
          deviceSecurityType: DeviceSecurityType.Both,
        };
        await service.initializeUnlockMode();
        expect(mockVault.updateConfig).toHaveBeenCalledTimes(1);
        expect(mockVault.updateConfig).toHaveBeenCalledWith(expectedConfig);
      });

      it('provisions FaceID permissions if needed', async () => {
        spyOn(Device, 'isSystemPasscodeSet').and.returnValue(Promise.resolve(true));
        spyOn(Device, 'isBiometricsEnabled').and.returnValue(Promise.resolve(true));
        spyOn(Device, 'isBiometricsAllowed').and.returnValue(Promise.resolve(BiometricPermissionState.Prompt));
        spyOn(Device, 'showBiometricPrompt').and.returnValue(Promise.resolve());
        await service.initializeUnlockMode();
        expect(Device.showBiometricPrompt).toHaveBeenCalledTimes(1);
        expect(Device.showBiometricPrompt).toHaveBeenCalledWith({
          iosBiometricsLocalizedReason: 'Authenticate to continue',
        });
      });

      it('does not provision FaceID permissions if it was previously denied', async () => {
        spyOn(Device, 'isSystemPasscodeSet').and.returnValue(Promise.resolve(true));
        spyOn(Device, 'isBiometricsEnabled').and.returnValue(Promise.resolve(true));
        spyOn(Device, 'isBiometricsAllowed').and.returnValue(Promise.resolve(BiometricPermissionState.Denied));
        spyOn(Device, 'showBiometricPrompt').and.returnValue(Promise.resolve());
        await service.initializeUnlockMode();
        expect(Device.showBiometricPrompt).not.toHaveBeenCalled();
      });

      it('does not provision FaceID permissions if it was previously granted', async () => {
        spyOn(Device, 'isSystemPasscodeSet').and.returnValue(Promise.resolve(true));
        spyOn(Device, 'isBiometricsEnabled').and.returnValue(Promise.resolve(true));
        spyOn(Device, 'isBiometricsAllowed').and.returnValue(Promise.resolve(BiometricPermissionState.Granted));
        spyOn(Device, 'showBiometricPrompt').and.returnValue(Promise.resolve());
        await service.initializeUnlockMode();
        expect(Device.showBiometricPrompt).not.toHaveBeenCalled();
      });
    });

    describe('on web', () => {
      beforeEach(() => {
        const platform = TestBed.inject(Platform);
        (platform.is as any).withArgs('hybrid').and.returnValue(false);
      });

      it('does not update the config', async () => {
        await service.initializeUnlockMode();
        expect(mockVault.updateConfig).not.toHaveBeenCalled();
      });
    });
  });

  describe('set session', () => {
    it('sets the session', async () => {
      const session = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        idToken: 'test-id-token',
      };
      await service.setSession(session as AuthResult);
      expect(mockVault.setValue).toHaveBeenCalledTimes(1);
      expect(mockVault.setValue).toHaveBeenCalledWith('session', session);
    });
  });

  describe('get session', () => {
    it('gets the session', async () => {
      await service.getSession();
      expect(mockVault.getValue).toHaveBeenCalledTimes(1);
      expect(mockVault.getValue).toHaveBeenCalledWith('session');
    });

    it('resolves the session returned from the vault', async () => {
      (mockVault.getValue as jasmine.Spy).and.returnValue(
        Promise.resolve({
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          idToken: 'test-id-token',
        })
      );
      expect(await service.getSession()).toEqual({
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        idToken: 'test-id-token',
      } as AuthResult);
    });
  });

  describe('clear session', () => {
    it('clears the vault', async () => {
      await service.clearSession();
      expect(mockVault.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('session is locked', () => {
    it('is false if the vault is not locked', async () => {
      (mockVault.isLocked as jasmine.Spy).and.returnValue(Promise.resolve(false));
      (mockVault.isEmpty as jasmine.Spy).and.returnValue(Promise.resolve(false));
      expect(await service.sessionIsLocked()).toBe(false);
    });

    it('is false if the vault is empty', async () => {
      (mockVault.isLocked as jasmine.Spy).and.returnValue(Promise.resolve(true));
      (mockVault.isEmpty as jasmine.Spy).and.returnValue(Promise.resolve(true));
      expect(await service.sessionIsLocked()).toBe(false);
    });

    it('is true if the vault is not empty and is locked', async () => {
      (mockVault.isLocked as jasmine.Spy).and.returnValue(Promise.resolve(true));
      (mockVault.isEmpty as jasmine.Spy).and.returnValue(Promise.resolve(false));
      expect(await service.sessionIsLocked()).toBe(true);
    });
  });

  describe('onPasscodeRequested', () => {
    beforeEach(async () => {
      (modal.onDidDismiss as any).and.returnValue(Promise.resolve({ role: 'cancel' }));
      await service.getSession(); // just done to init the vault
    });

    [true, false].forEach((setPasscode) => {
      it(`creates a PIN dialog, setting passcode: ${setPasscode}`, async () => {
        const modalController = TestBed.inject(ModalController);
        await onPasscodeRequestedCallback(setPasscode);
        expect(modalController.create).toHaveBeenCalledTimes(1);
        expect(modalController.create).toHaveBeenCalledWith({
          backdropDismiss: false,
          component: PinDialogComponent,
          componentProps: {
            setPasscodeMode: setPasscode,
          },
        });
      });
    });

    it('presents the modal', async () => {
      await onPasscodeRequestedCallback(false);
      expect(modal.present).toHaveBeenCalledTimes(1);
    });

    it('sets the custom passcode to the PIN', async () => {
      (modal.onDidDismiss as any).and.returnValue(Promise.resolve({ data: '4203', role: 'OK' }));
      await onPasscodeRequestedCallback(false);
      expect(mockVault.setCustomPasscode).toHaveBeenCalledTimes(1);
      expect(mockVault.setCustomPasscode).toHaveBeenCalledWith('4203');
    });

    it('sets the custom passcode to and empty string if the PIN is undefined', async () => {
      await onPasscodeRequestedCallback(false);
      expect(mockVault.setCustomPasscode).toHaveBeenCalledTimes(1);
      expect(mockVault.setCustomPasscode).toHaveBeenCalledWith('');
    });
  });

  describe('unlock session', () => {
    it('unlocks the vault', async () => {
      await service.unlockSession();
      expect(mockVault.unlock).toHaveBeenCalledTimes(1);
    });
  });
});

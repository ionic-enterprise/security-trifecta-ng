import { SessionVaultService } from './session-vault.service';

export const createSessionVaultServiceMock = () =>
  jasmine.createSpyObj<SessionVaultService>('SessionVaultService', {
    disableLocking: Promise.resolve(),
    enableLocking: Promise.resolve(),
    clearSession: Promise.resolve(),
    getSession: Promise.resolve(null),
    initializeUnlockMode: Promise.resolve(),
    resetUnlockMode: Promise.resolve(),
    sessionIsLocked: Promise.resolve(false),
    setSession: Promise.resolve(),
    unlockSession: Promise.resolve(),
  });

import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { NavController, Platform } from '@ionic/angular';
import { AuthenticationService } from '../authentication/authentication.service';
import { SessionVaultService } from '../session-vault/session-vault.service';

export const authGuard: CanActivateFn = async (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Promise<boolean> => {
  const authentication = inject(AuthenticationService);
  const navController = inject(NavController);
  const platform = inject(Platform);
  const sessionVault = inject(SessionVaultService);

  if (platform.is('hybrid') && (await sessionVault.sessionIsLocked())) {
    navController.navigateRoot(['/', 'login']);
    return false;
  }

  if (!(await authentication.isAuthenticated())) {
    navController.navigateRoot(['/', 'login']);
    return false;
  }

  return true;
};

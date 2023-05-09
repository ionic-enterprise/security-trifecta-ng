import { Routes } from '@angular/router';
import { authGuard } from '@app/core';

export const routes: Routes = [
  {
    path: 'tasting-notes',
    loadComponent: () => import('./tasting-notes/tasting-notes.page').then((m) => m.TastingNotesPage),
    canActivate: [authGuard],
  },
  {
    path: '',
    redirectTo: 'tasting-notes',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'auth-action-complete',
    loadComponent: () =>
      import('./auth-action-complete/auth-action-complete.page').then((m) => m.AuthActionCompletePage),
  },
];

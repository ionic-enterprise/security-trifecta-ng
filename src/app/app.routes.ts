import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tasting-notes',
    loadComponent: () => import('./tasting-notes/tasting-notes.page').then((m) => m.TastingNotesPage),
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
];

import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { Login } from './components/auth/login/login';
import { Register } from './components/auth/register/register';
import { Shell } from './components/layout/shell/shell';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'requests',
        canActivate: [roleGuard(['CITIZEN', 'SUPERVISOR', 'ADMIN'])],
        loadComponent: () =>
          import('./components/service-requests/service-requests').then((m) => m.ServiceRequests),
      },
      {
        path: 'work-orders',
        canActivate: [roleGuard(['SUPERVISOR', 'WORKER', 'ADMIN', 'AUDITOR'])],
        loadComponent: () =>
          import('./components/work-orders/work-orders').then((m) => m.WorkOrders),
      },
      {
        path: 'tasks',
        canActivate: [roleGuard(['SUPERVISOR', 'WORKER', 'ADMIN'])],
        loadComponent: () => import('./components/tasks/tasks').then((m) => m.Tasks),
      },
      {
        path: 'assets',
        canActivate: [roleGuard(['ADMIN'])],
        loadComponent: () => import('./components/assets/assets').then((m) => m.Assets),
      },
      {
        path: 'inspections',
        canActivate: [roleGuard(['SUPERVISOR', 'ADMIN'])],
        loadComponent: () =>
          import('./components/inspections/inspections').then((m) => m.Inspections),
      },
      {
        path: 'maintenance',
        canActivate: [roleGuard(['SUPERVISOR', 'ADMIN', 'AUDITOR'])],
        loadComponent: () =>
          import('./components/maintenance/maintenance').then((m) => m.Maintenance),
      },
      {
        path: 'evidence',
        canActivate: [roleGuard(['SUPERVISOR', 'WORKER'])],
        loadComponent: () => import('./components/evidence/evidence').then((m) => m.Evidence),
      },
      {
        path: 'audit-logs',
        canActivate: [roleGuard(['AUDITOR'])],
        loadComponent: () => import('./components/audit-logs/audit-logs').then((m) => m.AuditLogs),
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];

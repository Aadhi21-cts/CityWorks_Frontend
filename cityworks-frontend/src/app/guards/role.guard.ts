import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const toast = inject(ToastService);
    if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
    if (auth.hasRole(...allowedRoles)) return true;
    toast.error('You do not have permission to access this page.');
    return router.createUrlTree(['/dashboard']);
  };
};

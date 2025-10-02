import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { UserService } from '../services/user.service';

export const authGuard: CanMatchFn = () => {
  const userSvc = inject(UserService);
  const router = inject(Router);

  const hasUser = !!userSvc.user();
  // ✅ evita side-effect (navigate). O Router decide redirecionar.
  return hasUser || router.createUrlTree(['/login']);
};

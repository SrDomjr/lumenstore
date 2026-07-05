import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const user = this.authService.getCurrentUser();
    if (!user || !this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Allowed roles can be provided as role names or roleIds
    const allowedRoles: string[] = (route.data && (route.data as any)['roles']) || [];
    const allowedRoleIds: number[] = (route.data && (route.data as any)['roleIds']) || [];

    // Try to read role info from user object
    const roleId = (user as any).roleId ?? (user as any).role?.id ?? null;
    const rolesArr: string[] = (user as any).roles || (user as any).authorities || [];

    if (allowedRoleIds.length && roleId != null) {
      if (allowedRoleIds.includes(Number(roleId))) return true;
    }

    if (allowedRoles.length && rolesArr && rolesArr.length) {
      const lower = rolesArr.map((r: any) => String(r).toLowerCase());
      for (const ar of allowedRoles) {
        if (lower.includes(ar.toLowerCase())) return true;
      }
    }

    // Fallback: common admin indicators
    if (roleId === 1) return true; // roleId 1 -> admin by convention
    if (rolesArr && rolesArr.some((r: any) => /admin/i.test(String(r)))) return true;

    // unauthorized
    this.router.navigate(['/home']);
    return false;
  }
}

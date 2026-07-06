import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('lumenstore-web');
  cartCount = 0;
  private destroy$ = new Subject<void>();

  constructor(
    public auth: AuthService,
    public cartService: CartService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.cartService.cartCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => (this.cartCount = count || 0));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    if (!user) return false;
    // Check roles array (from backend) or fallback to roleId
    if (user.roles && user.roles.some((r) => r.toLowerCase() === 'admin')) return true;
    if (user.roleId === 1) return true;
    if (user.authorities && user.authorities.some((a) => a.toLowerCase() === 'role_admin'))
      return true;
    return false;
  }

  onLogout() {
    // Clear local session immediately and notify server
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}

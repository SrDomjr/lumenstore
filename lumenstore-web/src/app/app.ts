import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  afterNextRender,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CartDrawerComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('lumenstore-web');
  cartCount = 0;
  protected readonly isAdmin = signal(false);
  protected readonly isAdminRoute = signal(false);
  private destroy$ = new Subject<void>();

  constructor(
    public auth: AuthService,
    public cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    // Sync initial values to avoid ExpressionChangedAfterItHasBeenCheckedError
    this.cartCount = this.cartService.getItemCount();
    this.isAdmin.set(this.checkIsAdmin());

    // Subscribe to cart count updates after render to avoid ExpressionChanged
    afterNextRender(() => {
      this.cartService.cartCount$.pipe(takeUntil(this.destroy$)).subscribe((count) => {
        this.cartCount = count || 0;
      });
    });
  }

  ngOnInit() {
    // Track admin status reactively from the user stream
    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isAdmin.set(this.checkIsAdmin());
    });

    // Detect admin route changes for navbar adaptation
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.isAdminRoute.set(this.router.url.startsWith('/admin'));
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkIsAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    if (!user) return false;
    if (user.roles && user.roles.some((r) => r.toLowerCase() === 'admin')) return true;
    if (user.roleId === 1) return true;
    if (user.authorities && user.authorities.some((a) => a.toLowerCase() === 'role_admin'))
      return true;
    return false;
  }

  onLogout() {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}

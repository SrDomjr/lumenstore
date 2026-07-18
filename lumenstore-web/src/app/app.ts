import {
  Component,
  signal,
  OnInit,
  OnDestroy,
  afterNextRender,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';
import { WishlistService } from './services/wishlist.service';
import { StoreInfoService, Banner } from './services/store-info.service';
import { CartDrawerComponent } from './components/cart-drawer/cart-drawer.component';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CartDrawerComponent,
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('searchWrap') searchWrapRef?: ElementRef<HTMLElement>;
  @ViewChild('accountTrigger') accountTriggerRef?: ElementRef<HTMLElement>;
  @ViewChild('userDropdown') userDropdownRef?: ElementRef<HTMLElement>;

  cartCount = 0;
  wishlistCount = 0;
  currentYear = new Date().getFullYear();

  topBanner: Banner | null = null;

  searchExpanded = false;
  searchQuery = '';

  isScrolled = false;
  promoHidden = false;
  private lastScrollY = 0;

  mobileMenuOpen = false;

  userDropdownOpen = false;
  private dropdownTimer: ReturnType<typeof setTimeout> | null = null;

  newsletterEmail = '';
  newsletterLoading = false;
  newsletterSuccess = false;

  protected readonly isAdminUser = signal(false);
  protected readonly isAdminRoute = signal(false);
  private destroy$ = new Subject<void>();

  constructor(
    public auth: AuthService,
    public cartService: CartService,
    private wishlistService: WishlistService,
    private storeInfo: StoreInfoService,
    private router: Router,
  ) {
    this.cartCount = this.cartService.getItemCount();
    this.isAdminUser.set(this.checkIsAdmin());

    afterNextRender(() => {
      this.cartService.cartCount$.pipe(takeUntil(this.destroy$)).subscribe((count) => {
        this.cartCount = count || 0;
      });
      window.addEventListener('scroll', this.onScroll, { passive: true });
      window.addEventListener('keydown', this.onKeyDown);
    });
  }

  ngOnInit() {
    this.auth.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      this.isAdminUser.set(this.checkIsAdmin());
      if (user) {
        this.wishlistService.getDefaultWishlist(user.id).pipe(takeUntil(this.destroy$)).subscribe({
          next: (wl) => (this.wishlistCount = wl?.itemCount || 0),
          error: () => {},
        });
      } else {
        this.wishlistCount = 0;
      }
    });

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        this.isAdminRoute.set(this.router.url.startsWith('/admin'));
        this.setMobileMenu(false);
        this.userDropdownOpen = false;
        this.searchExpanded = false;
        this.searchQuery = '';
      });

    this.storeInfo.getBannersByPosition('home_top').pipe(takeUntil(this.destroy$)).subscribe({
      next: (banners) => (this.topBanner = banners.length ? banners[0] : null),
      error: () => {},
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
      window.removeEventListener('keydown', this.onKeyDown);
    }
    this.clearDropdownTimer();
  }

  private onScroll = () => {
    const y = window.scrollY;
    this.isScrolled = y > 4;
    this.promoHidden = y > 60 && y > this.lastScrollY;
    this.lastScrollY = y;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (this.userDropdownOpen) {
        this.userDropdownOpen = false;
      } else if (this.searchExpanded) {
        this.searchExpanded = false;
        this.searchQuery = '';
      } else if (this.mobileMenuOpen) {
        this.mobileMenuOpen = false;
      }
    }
  };

  toggleSearch() {
    this.searchExpanded = !this.searchExpanded;
    if (this.searchExpanded) {
      setTimeout(() => this.searchInputRef?.nativeElement.focus(), 50);
    } else {
      this.searchQuery = '';
    }
  }

  setMobileMenu(open: boolean) {
    this.mobileMenuOpen = open;
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('drawer-open', open);
    }
  }

  executeSearch() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/store'], { queryParams: { q: this.searchQuery.trim() } });
      this.searchExpanded = false;
      this.searchQuery = '';
    }
  }

  closeDropdownTimer() {
    this.clearDropdownTimer();
    this.dropdownTimer = setTimeout(() => {
      this.userDropdownOpen = false;
    }, 200);
  }

  cancelDropdownTimer() {
    this.clearDropdownTimer();
  }

  private clearDropdownTimer() {
    if (this.dropdownTimer) {
      clearTimeout(this.dropdownTimer);
      this.dropdownTimer = null;
    }
  }

  onNewsletterSubmit(event: Event) {
    event.preventDefault();
    if (!this.newsletterEmail.trim() || this.newsletterLoading || this.newsletterSuccess) return;
    this.newsletterLoading = true;
    this.storeInfo.subscribeNewsletter(this.newsletterEmail.trim()).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.newsletterLoading = false;
        this.newsletterSuccess = true;
      },
      error: () => (this.newsletterLoading = false),
    });
  }

  isCurrentUserAdmin(): boolean {
    return this.isAdminUser();
  }

  private checkIsAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    if (!user) return false;
    if (user.roles && user.roles.some((r) => r.toLowerCase() === 'admin')) return true;
    if (user.roleId === 1) return true;
    if (user.authorities && user.authorities.some((a) => a.toLowerCase() === 'role_admin')) return true;
    return false;
  }

  onLogout() {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}

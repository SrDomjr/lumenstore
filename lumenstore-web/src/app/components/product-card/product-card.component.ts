import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

export interface ProductCardModel {
  id: number;
  slug: string;
  name: string;
  brand?: { name: string } | string;
  images?: string[];
  price: number;
  compare_at_price?: number | null;
  averageRating?: number;
  reviewCount?: number;
  inStock?: boolean;
  hasVariants?: boolean;
}

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductCardComponent implements OnInit {
  @Input({ required: true }) product!: ProductCardModel;
  @Output() addToCartEvent = new EventEmitter<ProductCardModel>();
  isInWishlist = false;

  private router = inject(Router);
  private wishlistService = inject(WishlistService);
  private authService = inject(AuthService);
  private notification = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  get brandName(): string {
    if (!this.product) return '';
    if (typeof this.product.brand === 'string') return this.product.brand;
    return (this.product.brand && (this.product.brand as any).name) || '';
  }

  get discountPercent(): number | null {
    if (!this.product?.compare_at_price) return null;
    const diff = this.product.compare_at_price - (this.product.price || 0);
    if (diff <= 0) return null;
    return Math.round((diff / this.product.compare_at_price) * 100);
  }

  get avgRating(): string {
    return (this.product.averageRating || 0).toFixed(1);
  }

  ngOnInit(): void {
    this.checkWishlistStatus();
  }

  private checkWishlistStatus(): void {
    const clientId = this.getClientId();
    if (!clientId || !this.product?.id) return;

    this.wishlistService.getDefaultWishlist(clientId).subscribe({
      next: (w) => {
        if (w?.id) {
          this.wishlistService.isProductInWishlist(clientId, w.id, this.product.id).subscribe({
            next: (exists) => {
              this.isInWishlist = !!exists;
              this.cdr.markForCheck();
            },
          });
        }
      },
    });
  }

  onAddToCart(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (this.product?.hasVariants) {
      this.router.navigate(['/store', this.product.slug]);
      return;
    }
    this.addToCartEvent.emit(this.product);
  }

  onWishlist(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    const clientId = this.getClientId();
    if (!clientId) {
      this.notification.warning('Inicia sesión para gestionar favoritos');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const pid = this.product?.id;
    if (!pid) return;

    this.wishlistService.getDefaultWishlist(clientId).subscribe({
      next: (w) => {
        const wid = w?.id;
        if (!wid) {
          this.createWishlistAndAdd(clientId, pid);
          return;
        }
        this.toggleWishlistItem(clientId, wid, pid);
      },
      error: () => this.createWishlistAndAdd(clientId, pid),
    });
  }

  private toggleWishlistItem(clientId: number, wishlistId: number, productId: number): void {
    if (this.isInWishlist) {
      this.wishlistService.removeProductFromWishlist(clientId, wishlistId, productId).subscribe({
        next: () => {
          this.isInWishlist = false;
          this.cdr.markForCheck();
        },
        error: () => this.notification.error('No se pudo quitar de favoritos'),
      });
    } else {
      this.wishlistService.addProductToWishlist(clientId, wishlistId, productId).subscribe({
        next: () => {
          this.isInWishlist = true;
          this.cdr.markForCheck();
        },
        error: () => this.notification.error('No se pudo agregar a favoritos'),
      });
    }
  }

  private createWishlistAndAdd(clientId: number, productId: number) {
    const req = { name: 'Favoritos', isDefault: true } as any;
    this.wishlistService.createWishlist(clientId, req).subscribe({
      next: (w) => {
        if (w?.id) {
          this.wishlistService.addProductToWishlist(clientId, w.id, productId).subscribe({
            next: () => {
              this.isInWishlist = true;
              this.cdr.markForCheck();
            },
            error: () => this.notification.error('No se pudo agregar a favoritos'),
          });
        }
      },
      error: () => this.notification.error('No se pudo crear lista de favoritos'),
    });
  }

  onCompare(e: Event) {
    e.stopPropagation();
  }

  private getClientId(): number | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }
}

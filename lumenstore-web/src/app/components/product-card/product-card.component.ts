import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';

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
})
export class ProductCardComponent implements OnInit {
  @Input() product!: ProductCardModel;
  @Output() addToCartEvent = new EventEmitter<ProductCardModel>();
  isInWishlist = false;

  constructor(
    private router: Router,
    private wishlistService: WishlistService,
  ) {}

  get brandName(): string {
    if (!this.product) return '';
    if (typeof this.product.brand === 'string') return this.product.brand as string;
    return (this.product.brand && (this.product.brand as any).name) || '';
  }

  get discountPercent(): number | null {
    if (!this.product?.compare_at_price) return null;
    const diff = this.product.compare_at_price - this.product.price || 0;
    if (diff <= 0) return null;
    return Math.round((diff / (this.product.compare_at_price || this.product.price)) * 100);
  }

  get avgRating(): string {
    return (this.product.averageRating || 0).toFixed(1);
  }

  ngOnInit(): void {
    // Try to detect if product is in user's default wishlist (best-effort)
    const clientId = this.getClientId();
    if (clientId && this.product && this.product.id) {
      this.wishlistService.getDefaultWishlist(clientId).subscribe({
        next: (w) => {
          if (w && w.id) {
            this.wishlistService.isProductInWishlist(clientId, w.id, this.product.id).subscribe({
              next: (exists) => (this.isInWishlist = !!exists),
              error: () => {},
            });
          }
        },
        error: () => {},
      });
    }
  }

  onAddToCart(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    if (this.product?.hasVariants) {
      // Redirect to product detail to choose variant
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
      alert('Inicia sesión para gestionar favoritos');
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    const pid = this.product?.id;
    if (!pid) {
      alert('Producto inválido');
      return;
    }

    // Ensure default wishlist exists, then toggle
    this.wishlistService.getDefaultWishlist(clientId).subscribe({
      next: (w) => {
        const wid = w?.id;
        if (!wid) {
          // Create a default wishlist and add
          this.createWishlistAndAdd(clientId, pid);
          return;
        }
        if (this.isInWishlist) {
          this.wishlistService.removeProductFromWishlist(clientId, wid, pid).subscribe({
            next: () => (this.isInWishlist = false),
            error: () => alert('No se pudo quitar de favoritos'),
          });
        } else {
          this.wishlistService.addProductToWishlist(clientId, wid, pid).subscribe({
            next: () => (this.isInWishlist = true),
            error: () => alert('No se pudo agregar a favoritos'),
          });
        }
      },
      error: () => {
        // Try create then add
        this.createWishlistAndAdd(clientId, pid);
      },
    });
  }

  private createWishlistAndAdd(clientId: number, productId: number) {
    const req = {
      name: 'Favoritos',
      description: 'Mis productos favoritos',
      isDefault: true,
    } as any;
    this.wishlistService.createWishlist(clientId, req).subscribe({
      next: (w) => {
        if (w && w.id) {
          this.wishlistService.addProductToWishlist(clientId, w.id, productId).subscribe({
            next: () => (this.isInWishlist = true),
            error: () => alert('No se pudo agregar a favoritos'),
          });
        }
      },
      error: () => alert('No se pudo crear lista de favoritos'),
    });
  }

  onCompare(e: Event) {
    e.stopPropagation();
    console.log('compare', this.product?.id);
  }

  private getClientId(): number | null {
    const u = localStorage.getItem('currentUser');
    if (u) return JSON.parse(u).id;
    return null;
  }
}

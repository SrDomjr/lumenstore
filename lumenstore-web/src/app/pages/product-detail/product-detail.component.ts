import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import {
  ProductoResponseDTO,
  ProductVariantResponseDTO,
  ProductReview,
  CarritoItemRequestDTO,
} from '../../models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: ProductoResponseDTO | null = null;
  variants: ProductVariantResponseDTO[] = [];
  reviews: ProductReview[] = [];
  loading = false;
  selectedVariant: ProductVariantResponseDTO | null = null;
  quantity = 1;
  addedToCart = false;
  addedToWishlist = false;
  isAuthenticated = false;
  activeTab: 'details' | 'reviews' | 'questions' = 'details';

  // Review form
  reviewRating = 5;
  reviewTitle = '';
  reviewComment = '';

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  loadProduct(id: number) {
    this.loading = true;
    this.productService.getProductById(id).subscribe(
      (product) => {
        this.product = product;
        this.loadVariants(id);
        this.loadReviews(id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    );
  }

  loadVariants(productId: number) {
    this.productService.getProductVariants(productId).subscribe((variants) => {
      this.variants = variants;
      if (variants.length > 0) {
        this.selectedVariant = variants[0];
      }
      this.cdr.detectChanges();
    });
  }

  loadReviews(productId: number) {
    this.productService.getProductReviews(productId).subscribe((reviews) => {
      this.reviews = reviews;
      this.cdr.detectChanges();
    });
  }

  selectVariant(variant: ProductVariantResponseDTO) {
    this.selectedVariant = variant;
    this.quantity = 1;
    this.addedToCart = false;
  }

  getUniqueSizes(): string[] {
    const sizes = this.variants.filter((v) => v.sizeName).map((v) => v.sizeName!);
    return [...new Set(sizes)];
  }

  getUniqueColors(): ProductVariantResponseDTO[] {
    const seen = new Set<string>();
    return this.variants.filter((v) => {
      const key = v.colorName || v.colorHex || '';
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getVariantsBySize(sizeName: string): ProductVariantResponseDTO[] {
    return this.variants.filter((v) => v.sizeName === sizeName);
  }

  getVariantsByColor(colorName: string): ProductVariantResponseDTO[] {
    return this.variants.filter((v) => v.colorName === colorName);
  }

  get currentPrice(): number {
    if (this.selectedVariant) return this.selectedVariant.price;
    if (this.product) return this.product.basePrice;
    return 0;
  }

  get compareAtPrice(): number | null {
    if (this.selectedVariant?.compareAtPrice) return this.selectedVariant.compareAtPrice;
    return null;
  }

  get totalStock(): number {
    return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  get hasDiscount(): boolean {
    return (this.product?.discount || 0) > 0;
  }

  get discountedPrice(): number {
    if (!this.product?.discount) return this.currentPrice;
    return this.currentPrice * (1 - this.product.discount / 100);
  }

  addToCart() {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    const clientId = this.getClientId();
    if (!clientId || !this.selectedVariant) return;

    const item: CarritoItemRequestDTO = {
      productVariantId: this.selectedVariant.id,
      quantity: this.quantity,
    };

    this.cartService.addToCart(clientId, item).subscribe(
      () => {
        this.addedToCart = true;
        this.cdr.detectChanges();
        setTimeout(() => (this.addedToCart = false), 3000);
      },
      () => alert('Error al agregar al carrito'),
    );
  }

  addToWishlist() {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    const clientId = this.getClientId();
    if (!clientId || !this.product) return;

    this.wishlistService.getDefaultWishlist(clientId).subscribe(
      (wl) => {
        const wishlistId = wl?.id;
        if (!wishlistId) {
          alert('No se encontró la lista de deseos por defecto.');
          return;
        }
        this.wishlistService.addProductToWishlist(clientId, wishlistId, this.product!.id).subscribe(
          () => {
            this.addedToWishlist = true;
            this.cdr.detectChanges();
            setTimeout(() => (this.addedToWishlist = false), 3000);
          },
          () => alert('Error al añadir a la lista de deseos'),
        );
      },
      () => alert('Error obteniendo la lista de deseos'),
    );
  }

  submitReview() {
    if (!this.isAuthenticated || !this.product) return;
    const clientId = this.getClientId();
    if (!clientId) return;

    const review = {
      productId: this.product.id,
      customerId: clientId,
      rating: this.reviewRating,
      title: this.reviewTitle,
      comment: this.reviewComment,
    };

    this.productService.createReview(review).subscribe(
      () => {
        alert('Review submitted successfully!');
        this.reviewRating = 5;
        this.reviewTitle = '';
        this.reviewComment = '';
        this.loadReviews(this.product!.id);
      },
      () => alert('Error submitting review'),
    );
  }

  private getClientId(): number | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user).id : null;
  }
}

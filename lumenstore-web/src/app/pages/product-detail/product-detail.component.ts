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
  selectedImage: string | null = null;
  quantity = 1;
  addedToCart = false;
  addedToWishlist = false;
  isAuthenticated = false;
  activeTab: 'details' | 'reviews' = 'details';

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
      const param = params['id'] ?? params['slug'];
      if (param) {
        this.loadProduct(param);
      }
    });
  }
  loadProduct(idOrSlug: string | number) {
    this.loading = true;

    const tryLoadById = (id: number) => {
      this.productService.getProductById(id).subscribe(
        (product) => {
          this.onProductLoaded(product);
        },
        (err) => {
          console.warn('getProductById failed, error:', err);
          this.loading = false;
          this.cdr.detectChanges();
        },
      );
    };

    if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
      tryLoadById(Number(idOrSlug));
      return;
    }

    // Otherwise try by slug
    this.productService.getProductBySlug(String(idOrSlug)).subscribe(
      (product) => {
        this.onProductLoaded(product);
      },
      (err) => {
        console.warn('getProductBySlug failed, error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    );
  }

  private onProductLoaded(product: ProductoResponseDTO) {
    this.product = product;
    const pid = product.id;
    this.selectedImage = product.images?.length ? product.images[0] : null;
    if (pid) {
      this.loadVariants(pid);
      this.loadReviews(pid);
    }
    this.loading = false;
    this.cdr.detectChanges();
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
    if (this.variants.length > 0) {
      return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
    }
    return this.product?.stock || 0;
  }

  get displayImage(): string {
    if (this.selectedImage) {
      return this.selectedImage;
    }
    if (this.product?.images?.length) {
      return this.product.images[0];
    }
    return `https://via.placeholder.com/600x600?text=${encodeURIComponent(this.product?.name || 'Producto')}`;
  }

  get ratingStars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  get reviewCount(): number {
    return this.reviews.length;
  }

  get averageRating(): number {
    if (!this.reviews.length) {
      return 0;
    }
    const total = this.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return total / this.reviews.length;
  }

  get roundedRating(): number {
    return Math.round(this.averageRating);
  }

  get availability(): string {
    if (this.selectedVariant) {
      return (this.selectedVariant.stock || 0) > 0 ? 'En stock' : 'Agotado';
    }
    return (this.product?.stock || 0) > 0 ? 'En stock' : 'Agotado';
  }

  selectImage(imageUrl: string) {
    this.selectedImage = imageUrl;
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

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CloudinaryUrlPipe } from '../../pipes/cloudinary-url.pipe';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import {
  ProductoResponseDTO,
  ProductVariantResponseDTO,
  ProductReview,
  ProductQuestion,
  ProductImage,
  Producto,
  CarritoItemRequestDTO,
} from '../../models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CloudinaryUrlPipe],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: ProductoResponseDTO | null = null;
  variants: ProductVariantResponseDTO[] = [];
  reviews: ProductReview[] = [];
  questions: ProductQuestion[] = [];
  images: ProductImage[] = [];
  relatedProducts: Producto[] = [];
  loading = false;

  selectedVariant: ProductVariantResponseDTO | null = null;
  selectedColor: string | null = null;
  selectedSize: string | null = null;
  selectedImageIndex = 0;
  quantity = 1;
  addedToCart = false;
  addedToWishlist = false;
  isInWishlist = false;
  isAuthenticated = false;

  /* Accordion state */
  descExpanded = false;
  shippingExpanded = false;
  sizeGuideExpanded = false;
  compositionExpanded = false;

  /* Review form */
  reviewRating = 5;
  reviewTitle = '';
  reviewComment = '';
  showReviewForm = false;

  /* Question form */
  questionText = '';
  showQuestionForm = false;

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    public router: Router,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private authService: AuthService,
    private notification: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.route.params.subscribe((params) => {
      const param = params['id'] ?? params['slug'];
      if (param) this.loadProduct(param);
    });
  }

  /* ─── Data Loading ──────────────────────────────────── */
  loadProduct(idOrSlug: string | number) {
    this.loading = true;
    this.cdr.detectChanges();

    const onSuccess = (product: ProductoResponseDTO) => this.onProductLoaded(product);
    const onError = () => {
      this.loading = false;
      this.cdr.detectChanges();
    };

    if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
      this.productService.getProductById(Number(idOrSlug)).subscribe(onSuccess, onError);
    } else {
      this.productService.getProductBySlug(String(idOrSlug)).subscribe(onSuccess, onError);
    }
  }

  private onProductLoaded(product: ProductoResponseDTO) {
    if (!product.isActive) {
      this.product = null;
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    this.product = product;
    this.selectedImageIndex = 0;
    this.descExpanded = false;

    const pid = product.id;
    if (pid) {
      this.loadVariants(pid);
      this.loadImages(pid);
      this.loadReviews(pid);
      this.loadQuestions(pid);
      this.loadRelated(pid, product.categoryId);
      if (this.isAuthenticated) this.checkWishlistStatus(pid);
    }
    this.loading = false;
    this.cdr.detectChanges();
  }

  loadVariants(pid: number) {
    this.productService.getProductVariants(pid).subscribe((v) => {
      this.variants = (v || []).filter((vr) => vr.isActive !== false);
      if (this.variants.length > 0) {
        this.selectedVariant = this.variants[0];
        this.selectedColor = this.selectedVariant.colorName || null;
        this.selectedSize = this.selectedVariant.sizeName || null;
      }
      this.cdr.detectChanges();
    });
  }

  loadImages(pid: number) {
    this.productService.getProductImages(pid).subscribe((imgs) => {
      this.images = (imgs || []).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      this.cdr.detectChanges();
    });
  }

  loadReviews(pid: number) {
    this.productService.getProductReviews(pid).subscribe((r) => {
      this.reviews = (r || []).filter((rev) => rev.isApproved !== false);
      this.cdr.detectChanges();
    });
  }

  loadQuestions(pid: number) {
    this.productService.getProductQuestions(pid).subscribe((q) => {
      this.questions = (q || []).filter((qr) => !!qr.answeredAt && !!qr.answer);
      this.cdr.detectChanges();
    });
  }

  loadRelated(pid: number, catId?: number) {
    this.productService.getRelatedProducts(pid, catId).subscribe((p) => {
      this.relatedProducts = (p || []).filter((rp) => rp.id !== pid).slice(0, 4);
      this.cdr.detectChanges();
    });
  }

  /* ─── Image Gallery ─────────────────────────────────── */
  get galleryImages(): string[] {
    if (this.images.length > 0) return this.images.map((i) => i.imageUrl);
    return this.product?.images || [];
  }

  get mainImage(): string {
    return this.galleryImages[this.selectedImageIndex] || this.galleryImages[0] || '';
  }

  get mainImageAlt(): string {
    const img = this.images[this.selectedImageIndex];
    return img?.altText || this.product?.name || '';
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
  }

  prevImage() {
    if (this.selectedImageIndex > 0) this.selectedImageIndex--;
  }

  nextImage() {
    if (this.selectedImageIndex < this.galleryImages.length - 1) this.selectedImageIndex++;
  }

  /* When a color is selected, filter images by variant_id */
  filterImagesByColor(colorName: string) {
    if (!colorName || this.images.length === 0) return;
    const colorVariants = this.variants.filter((v) => v.colorName === colorName);
    const variantIds = new Set(colorVariants.map((v) => v.id));
    const colorImages = this.images.filter((img) => img.variantId && variantIds.has(img.variantId));
    if (colorImages.length > 0) {
      this.selectedImageIndex = this.images.indexOf(colorImages[0]);
    }
  }

  /* ─── Variant Selection ─────────────────────────────── */
  get uniqueColors(): { name: string; hex: string; inStock: boolean }[] {
    const map = new Map<string, { name: string; hex: string; inStock: boolean }>();
    for (const v of this.variants) {
      const key = v.colorName || v.colorHex || 'color';
      const existing = map.get(key);
      const inStock = (v.stock || 0) > 0;
      if (existing) {
        existing.inStock = existing.inStock || inStock;
      } else {
        map.set(key, { name: v.colorName || '', hex: v.colorHex || '#ccc', inStock });
      }
    }
    return Array.from(map.values());
  }

  get uniqueSizes(): { name: string; inStock: boolean; sortOrder: number }[] {
    const map = new Map<string, { name: string; inStock: boolean; sortOrder: number }>();
    let idx = 0;
    for (const v of this.variants) {
      const key = v.sizeName || 'size';
      const existing = map.get(key);
      const inStock = (v.stock || 0) > 0;
      if (existing) {
        existing.inStock = existing.inStock || inStock;
      } else {
        map.set(key, { name: v.sizeName || '', inStock, sortOrder: idx++ });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  selectColor(color: { name: string; hex: string }) {
    this.selectedColor = color.name;
    this.quantity = 1;
    this.findMatchingVariant();
    this.filterImagesByColor(color.name);
  }

  selectSize(size: { name: string }) {
    this.selectedSize = size.name;
    this.quantity = 1;
    this.findMatchingVariant();
  }

  private findMatchingVariant() {
    const match = this.variants.find(
      (v) =>
        (!this.selectedColor || v.colorName === this.selectedColor) &&
        (!this.selectedSize || v.sizeName === this.selectedSize),
    );
    this.selectedVariant = match || this.variants[0] || null;
  }

  /* ─── Computed ──────────────────────────────────────── */
  get currentPrice(): number {
    if (this.selectedVariant) return this.selectedVariant.price;
    return this.product?.basePrice || 0;
  }

  get compareAtPrice(): number | null {
    if (this.selectedVariant?.compareAtPrice) return this.selectedVariant.compareAtPrice;
    return null;
  }

  get discountPercent(): number | null {
    const cap = this.compareAtPrice;
    if (!cap || cap <= this.currentPrice) return null;
    return Math.round(((cap - this.currentPrice) / cap) * 100);
  }

  get totalStock(): number {
    return this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }

  get selectedStock(): number {
    return this.selectedVariant?.stock || 0;
  }

  get isOutOfStock(): boolean {
    return this.totalStock <= 0;
  }

  get isLowStock(): boolean {
    return this.selectedStock > 0 && this.selectedStock < 5;
  }

  get isSoldOut(): boolean {
    return this.selectedStock <= 0;
  }

  get roundedRating(): number {
    return Math.round(this.averageRating);
  }

  get Math(): Math {
    return Math;
  }

  get averageRating(): number {
    if (!this.reviews.length) return 0;
    return this.reviews.reduce((s, r) => s + (r.rating || 0), 0) / this.reviews.length;
  }

  get ratingDistribution(): { stars: number; count: number; pct: number }[] {
    const total = this.reviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      stars: star,
      count: this.reviews.filter((r) => r.rating === star).length,
      pct: (this.reviews.filter((r) => r.rating === star).length / total) * 100,
    }));
  }

  /* ─── Cart ──────────────────────────────────────────── */
  incrementQty() {
    if (this.quantity < this.selectedStock) this.quantity++;
  }

  decrementQty() {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart() {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const clientId = this.getClientId();
    if (!clientId || !this.selectedVariant) return;

    const item: CarritoItemRequestDTO = {
      productVariantId: this.selectedVariant.id,
      quantity: this.quantity,
    };

    this.cartService.addToCart(clientId, item).subscribe({
      next: () => {
        this.addedToCart = true;
        this.notification.success('Producto agregado al carrito.');
        this.cdr.detectChanges();
        setTimeout(() => (this.addedToCart = false), 3000);
      },
      error: () => this.notification.error('No se pudo agregar al carrito.'),
    });
  }

  /* ─── Wishlist ──────────────────────────────────────── */
  private checkWishlistStatus(productId: number) {
    const clientId = this.getClientId();
    if (!clientId) return;
    this.wishlistService.getDefaultWishlist(clientId).subscribe({
      next: (w) => {
        if (w?.id) {
          this.wishlistService.isProductInWishlist(clientId, w.id, productId).subscribe({
            next: (exists) => {
              this.isInWishlist = !!exists;
              this.cdr.detectChanges();
            },
          });
        }
      },
    });
  }

  toggleWishlist() {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const clientId = this.getClientId();
    if (!clientId || !this.product) return;

    this.wishlistService.getDefaultWishlist(clientId).subscribe({
      next: (w) => {
        if (!w?.id) return;
        if (this.isInWishlist) {
          this.wishlistService.removeProductFromWishlist(clientId, w.id, this.product!.id).subscribe({
            next: () => {
              this.isInWishlist = false;
              this.notification.success('Eliminado de favoritos.');
              this.cdr.detectChanges();
            },
          });
        } else {
          this.wishlistService.addProductToWishlist(clientId, w.id, this.product!.id).subscribe({
            next: () => {
              this.isInWishlist = true;
              this.notification.success('Agregado a favoritos.');
              this.cdr.detectChanges();
            },
          });
        }
      },
    });
  }

  /* ─── Share ─────────────────────────────────────────── */
  share() {
    if (navigator.share) {
      navigator.share({ title: this.product?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      this.notification.success('Enlace copiado al portapapeles.');
    }
  }

  /* ─── Reviews ───────────────────────────────────────── */
  toggleReviewForm() {
    this.showReviewForm = !this.showReviewForm;
  }

  submitReview() {
    if (!this.isAuthenticated || !this.product) return;
    const clientId = this.getClientId();
    if (!clientId) return;

    this.productService.createReview({
      productId: this.product.id,
      customerId: clientId,
      rating: this.reviewRating,
      title: this.reviewTitle,
      comment: this.reviewComment,
    }).subscribe({
      next: () => {
        this.notification.success('Reseña enviada correctamente.');
        this.reviewRating = 5;
        this.reviewTitle = '';
        this.reviewComment = '';
        this.showReviewForm = false;
        this.loadReviews(this.product!.id);
      },
      error: () => this.notification.error('No se pudo enviar la reseña.'),
    });
  }

  /* ─── Questions ─────────────────────────────────────── */
  toggleQuestionForm() {
    this.showQuestionForm = !this.showQuestionForm;
  }

  submitQuestion() {
    if (!this.isAuthenticated || !this.product || !this.questionText.trim()) return;
    const clientId = this.getClientId();
    if (!clientId) return;

    this.productService.createQuestion({
      productId: this.product.id,
      customerId: clientId,
      question: this.questionText.trim(),
    }).subscribe({
      next: () => {
        this.notification.success('Pregunta enviada. Te notificaremos cuando sea respondida.');
        this.questionText = '';
        this.showQuestionForm = false;
      },
      error: () => this.notification.error('No se pudo enviar la pregunta.'),
    });
  }

  /* ─── Helpers ───────────────────────────────────────── */
  private getClientId(): number | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }
}

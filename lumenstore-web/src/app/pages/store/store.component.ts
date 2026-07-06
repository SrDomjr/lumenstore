import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ProductCardComponent],
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss'],
})
export class StoreComponent implements OnInit {
  products: any[] = [];
  categories: any[] = [];
  brands: any[] = [];
  loading = false;
  error: string | null = null;
  query = '';
  priceRange = '';
  colors = ['Negro', 'Blanco', 'Beige', 'Azul', 'Rosa', 'Rojo', 'Gris'];
  sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  selectedCategory: number | null = null;
  selectedBrand: number | null = null;
  selectedColor: string | null = null;
  selectedSize: string | null = null;
  showCategoryFilters = false;
  showBrandFilters = false;
  showColorFilters = false;
  showSizeFilters = false;
  currentPage = 0;
  pageSize = 12;
  // UX state for add-to-cart
  addingSet = new Set<number | string>();
  successMessage: string | null = null;
  errorMessage: string | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.loadFilters();
    this.loadProducts();
  }

  private refreshView() {
    this.cdr.detectChanges();
  }

  loadFilters() {
    this.productService.getCategories().subscribe((cats) => {
      this.categories = cats || [];
      this.refreshView();
    });
    this.productService.getBrands().subscribe((bs) => {
      this.brands = bs || [];
      this.refreshView();
    });
  }

  private parsePriceRange(range: string): { minPrice?: number; maxPrice?: number } {
    if (!range) {
      return {};
    }
    if (range.endsWith('+')) {
      const min = parseFloat(range.replace('+', ''));
      return { minPrice: Number.isNaN(min) ? undefined : min };
    }
    const parts = range.split('-').map((value) => parseFloat(value));
    if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      return { minPrice: parts[0], maxPrice: parts[1] };
    }
    return {};
  }

  loadProducts() {
    this.loading = true;
    this.error = null;

    const priceFilter = this.parsePriceRange(this.priceRange);
    const filters: any = {
      query: this.query?.trim() || undefined,
      categoryId: this.selectedCategory || undefined,
      brandId: this.selectedBrand || undefined,
      minPrice: priceFilter.minPrice,
      maxPrice: priceFilter.maxPrice,
    };

    this.productService.getProducts(filters, this.currentPage, this.pageSize).subscribe(
      (response: any) => {
        const raw = response?.content || response || [];
        // Mapear a la forma esperada por ProductCardComponent
        this.products = (raw as any[]).map((p) => {
          const name = p.name || p.title || 'Producto';
          const placeholder = `https://via.placeholder.com/420x320?text=${encodeURIComponent(
            name,
          )}`;

          const images = (p.images && p.images.length && p.images) ||
            (p.variants && p.variants[0]?.images) || [placeholder];

          const price = p.price || p.basePrice || (p.variants && p.variants[0]?.price) || 0;
          const compare_at_price = p.compare_at_price || p.compareAtPrice || null;

          const averageRating = p.averageRating || p.rating || 0;
          const reviewCount = p.reviewCount || (p.reviews && p.reviews.length) || 0;

          const inStock =
            (p.stock && p.stock > 0) ||
            (p.variants && p.variants.some((v: any) => v.stock > 0)) ||
            false;
          const hasVariants = !!(p.variants && p.variants.length > 0);

          return {
            id: p.id || p.productId || null,
            slug:
              p.slug ||
              p.handle ||
              String(p.id || name)
                .toLowerCase()
                .replace(/\s+/g, '-'),
            name,
            brand: p.brand || p.brandName || (p.manufacturer && { name: p.manufacturer }),
            images,
            price,
            compare_at_price,
            averageRating,
            reviewCount,
            inStock,
            hasVariants,
            raw: p,
          };
        });
        this.loading = false;
        this.refreshView();
      },
      (err) => {
        console.error(err);
        this.error = 'No se pudieron cargar los productos.';
        this.loading = false;
        this.refreshView();
      },
    );
  }

  onSearch() {
    this.currentPage = 0;
    this.loadProducts();
  }

  clearFilters() {
    this.query = '';
    this.priceRange = '';
    this.selectedColor = null;
    this.selectedSize = null;
    this.selectedCategory = null;
    this.selectedBrand = null;
    this.currentPage = 0;
    this.loadProducts();
  }

  toggleCategoryFilters() {
    this.showCategoryFilters = !this.showCategoryFilters;
  }

  toggleBrandFilters() {
    this.showBrandFilters = !this.showBrandFilters;
  }

  toggleColorFilters() {
    this.showColorFilters = !this.showColorFilters;
  }

  toggleSizeFilters() {
    this.showSizeFilters = !this.showSizeFilters;
  }

  addToCart(product: any) {
    const clientId = this.getClientId();
    if (!clientId) {
      // Mejor UX: redirigir al login para que el usuario se autentique
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    // Avoid duplicate requests for the same product
    const prodKey = product.id || product.slug || JSON.stringify(product);
    if (this.addingSet.has(prodKey)) return;
    this.addingSet.add(prodKey);
    this.successMessage = null;
    this.errorMessage = null;

    // Preferir variante si existe (backend espera variant id)
    let variantId: any = null;
    if (product.raw && product.raw.variants && product.raw.variants.length) {
      variantId = product.raw.variants[0].id;
    } else if (product.variantId) {
      variantId = product.variantId;
    } else if (product.id) {
      variantId = product.id;
    }

    if (!variantId) {
      console.warn('No variant id found for product', product);
      this.errorMessage = 'No se encontró variante para agregar al carrito';
      setTimeout(() => (this.errorMessage = null), 3000);
      this.addingSet.delete(prodKey);
      return;
    }

    const item = { productVariantId: Number(variantId), quantity: 1 };
    console.log('Adding to cart request', { clientId, item, product });
    // Log current auth info to help debug 403/401
    try {
      console.log(
        'Auth user/token',
        this.authService.getCurrentUser(),
        this.authService.getToken(),
      );
    } catch (e) {}
    this.cartService.addToCart(clientId, item).subscribe(
      (res) => {
        console.log('AddToCart success', res);
        this.successMessage = 'Producto agregado al carrito';
        setTimeout(() => (this.successMessage = null), 2500);
        this.addingSet.delete(prodKey);
        // CartService.loadCart() is called internally; if you want to navigate:
        // this.router.navigate(['/cart']);
      },
      (err) => {
        console.error('AddToCart error', err);
        // Mostrar mensaje más descriptivo si está disponible
        if (err && err.status === 403) {
          this.errorMessage = 'Acceso denegado al carrito (403)';
        } else if (err && err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else if (err && err.statusText) {
          this.errorMessage = `Error: ${err.status} ${err.statusText}`;
        } else {
          this.errorMessage = 'No se pudo agregar al carrito';
        }
        setTimeout(() => (this.errorMessage = null), 4000);
        this.addingSet.delete(prodKey);
      },
    );
  }

  private getClientId(): number | null {
    const u = localStorage.getItem('currentUser');
    if (u) return JSON.parse(u).id;
    return null;
  }

  nextPage() {
    this.currentPage++;
    this.loadProducts();
  }

  prevPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadProducts();
    }
  }
}

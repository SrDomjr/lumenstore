import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-store',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
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
  showCategoryFilters = true;
  showBrandFilters = true;
  showColorFilters = true;
  showSizeFilters = true;
  currentPage = 0;
  pageSize = 12;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef,
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

  loadProducts() {
    this.loading = true;
    this.error = null;
    // If search query present, use search endpoint
    if (this.query && this.query.trim().length > 0) {
      this.productService.searchProducts(this.query.trim()).subscribe(
        (res) => {
          this.products = res || [];
          this.loading = false;
          this.refreshView();
        },
        (err) => {
          console.error(err);
          this.error = 'Error cargando productos';
          this.loading = false;
          this.refreshView();
        },
      );
      return;
    }

    // If category filter selected
    if (this.selectedCategory) {
      this.productService.getProductsByCategory(this.selectedCategory).subscribe(
        (res) => {
          this.products = res || [];
          this.loading = false;
          this.refreshView();
        },
        (err) => {
          console.error(err);
          this.error = 'Error cargando productos por categoría';
          this.loading = false;
          this.refreshView();
        },
      );
      return;
    }

    // If brand filter selected
    if (this.selectedBrand) {
      this.productService.getProductsByBrand(this.selectedBrand).subscribe(
        (res) => {
          this.products = res || [];
          this.loading = false;
          this.refreshView();
        },
        (err) => {
          console.error(err);
          this.error = 'Error cargando productos por marca';
          this.loading = false;
          this.refreshView();
        },
      );
      return;
    }

    // Default: paginated products
    this.productService.getProducts(this.currentPage, this.pageSize).subscribe(
      (response: any) => {
        this.products = response?.content || response || [];
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
      alert('Inicia sesión para agregar al carrito');
      return;
    }
    const item = { productVariantId: product.id, quantity: 1 };
    this.cartService.addToCart(clientId, item).subscribe(
      () => alert('Producto agregado al carrito'),
      () => alert('No se pudo agregar al carrito'),
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

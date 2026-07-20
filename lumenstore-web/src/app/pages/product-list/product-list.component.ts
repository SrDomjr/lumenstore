import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Params } from '@angular/router';
import { startWith } from 'rxjs';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { WishlistService } from '../../services/wishlist.service';
import { ProductoResponseDTO, CarritoItemRequestDTO } from '../../models';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  products: any[] = [];
  loading = false;
  error: string | null = null;
  currentPage = 0;
  pageSize = 12;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.queryParams.pipe(startWith<Params>({})).subscribe((params) => {
      if (params['category']) {
        this.loadProductsByCategory(+params['category']);
      } else if (params['brand']) {
        this.loadProductsByBrand(+params['brand']);
      } else if (params['search']) {
        this.searchProducts(params['search']);
      } else {
        this.loadProducts();
      }
    });
  }

  private refreshView() {
    this.cdr.detectChanges();
  }

  loadProducts() {
    this.loading = true;
    this.error = null;
    this.productService.getProducts(this.currentPage, this.pageSize).subscribe(
      (response: any) => {
        this.products = response?.content || response || [];
        this.loading = false;
        this.refreshView();
      },
      (err) => {
        console.error('Failed loading products', err);
        this.error = 'No se pudieron cargar los productos. Intenta recargar.';
        this.loading = false;
        this.refreshView();
      },
    );
  }

  loadProductsByCategory(categoryId: number) {
    this.loading = true;
    this.productService.getProductsByCategory(categoryId).subscribe(
      (products) => {
        this.products = products;
        this.loading = false;
        this.refreshView();
      },
      () => {
        this.loading = false;
        this.refreshView();
      },
    );
  }

  loadProductsByBrand(brandId: number) {
    this.loading = true;
    this.productService.getProductsByBrand(brandId).subscribe(
      (products) => {
        this.products = products;
        this.loading = false;
        this.refreshView();
      },
      () => {
        this.loading = false;
        this.refreshView();
      },
    );
  }

  searchProducts(query: string) {
    this.loading = true;
    this.productService.searchProducts(query).subscribe(
      (products) => {
        this.products = products;
        this.loading = false;
        this.refreshView();
      },
      () => {
        this.loading = false;
        this.refreshView();
      },
    );
  }

  addToCart(product: any) {
    const clientId = this.getClientId();
    if (clientId && product.id) {
      const item: CarritoItemRequestDTO = {
        productVariantId: product.id,
        quantity: 1,
      };
      this.cartService.addToCart(clientId, item).subscribe(() => {
        alert('Product added to cart!');
      });
    }
  }

  private getClientId(): number | null {
    const user = localStorage.getItem('currentUser');
    if (user) {
      return JSON.parse(user).id;
    }
    return null;
  }

  getDisplayPrice(product: any): number | null {
    if (!product) return null;
    if (product.price) return product.price;
    if (product.basePrice) return product.basePrice;
    if (product.variants && product.variants.length) return product.variants[0].price;
    if (product.productVariants && product.productVariants.length)
      return product.productVariants[0].price;
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

  trackByProductId(_index: number, product: any): any {
    return product.id;
  }
}

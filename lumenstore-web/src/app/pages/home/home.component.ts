import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CloudinaryUrlPipe } from '../../pipes/cloudinary-url.pipe';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProductService } from '../../services/product.service';
import { Producto } from '../../models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CloudinaryUrlPipe],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  trendingProducts: Producto[] = [];
  newProducts: Producto[] = [];
  discountedProducts: Producto[] = [];
  loading = false;
  private loadedCount = 0;

  constructor(
    private productService: ProductService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    console.log('HomeComponent: ngOnInit called');
    this.loadFeaturedProducts();
  }

  private onProductsLoaded(source: string) {
    this.loadedCount++;
    if (this.loadedCount >= 3) {
      this.loading = false;
    }
    this.cdr.detectChanges();
  }

  loadFeaturedProducts() {
    console.log('HomeComponent: loadFeaturedProducts called');
    this.loading = true;
    this.loadedCount = 0;

    this.productService
      .getTrendingProducts()
      .pipe(catchError(() => of([])))
      .subscribe((products) => {
        this.trendingProducts = products;
        this.onProductsLoaded('trending');
      });

    this.productService
      .getNewProducts()
      .pipe(catchError(() => of([])))
      .subscribe((products) => {
        this.newProducts = products;
        this.onProductsLoaded('new');
      });

    this.productService
      .getDiscountedProducts()
      .pipe(catchError(() => of([])))
      .subscribe((products) => {
        this.discountedProducts = products;
        this.onProductsLoaded('discounted');
      });
  }

  getProductImage(product: Producto, size: number): string {
    const fallbackText = encodeURIComponent(product.name || 'Product');
    const fallbackUrl = `https://via.placeholder.com/${size}x${size}?text=${fallbackText}`;
    return product.images?.length ? product.images[0] : fallbackUrl;
  }
}

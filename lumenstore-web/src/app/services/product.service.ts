import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ApiService } from './api.service';
import {
  Producto,
  ProductoResponseDTO,
  Marca,
  Categoria,
  ProductReview,
  ProductQuestion,
  ProductImage,
  ProductVariantResponseDTO,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class ProductService extends ApiService {
  private brandsCache$: Observable<Marca[]> | null = null;
  private categoriesCache$: Observable<Categoria[]> | null = null;

  getProducts(filters: any = {}, page: number = 0, size: number = 10): Observable<any> {
    const params: string[] = [];
    if (filters.categoryId) {
      params.push(`categoryId=${filters.categoryId}`);
    }
    if (filters.brandId) {
      params.push(`brandId=${filters.brandId}`);
    }
    if (filters.query) {
      params.push(`q=${encodeURIComponent(filters.query)}`);
    }
    if (filters.minPrice != null) {
      params.push(`minPrice=${filters.minPrice}`);
    }
    if (filters.maxPrice != null) {
      params.push(`maxPrice=${filters.maxPrice}`);
    }
    params.push(`page=${page}`);
    params.push(`size=${size}`);
    const queryString = params.length ? `?${params.join('&')}` : '';
    return this.get<any>(`/products${queryString}`);
  }

  getProductById(id: number): Observable<ProductoResponseDTO> {
    return this.get<ProductoResponseDTO>(`/products/${id}`);
  }

  getProductBySlug(slug: string): Observable<ProductoResponseDTO> {
    return this.get<ProductoResponseDTO>(`/products/slug/${encodeURIComponent(slug)}`);
  }

  getProductImages(productId: number): Observable<ProductImage[]> {
    return this.get<ProductImage[]>(`/products/${productId}/images`);
  }

  getProductVariants(productId: number): Observable<ProductVariantResponseDTO[]> {
    return this.get<ProductVariantResponseDTO[]>(`/products/${productId}/variants`);
  }

  // Reviews
  getProductReviews(productId: number): Observable<ProductReview[]> {
    return this.get<ProductReview[]>(`/products/${productId}/reviews`);
  }

  createReview(review: any): Observable<ProductReview> {
    return this.post<ProductReview>(`/products/reviews`, review);
  }

  // Questions
  getProductQuestions(productId: number): Observable<ProductQuestion[]> {
    return this.get<ProductQuestion[]>(`/products/${productId}/questions`);
  }

  createQuestion(question: any): Observable<ProductQuestion> {
    return this.post<ProductQuestion>(`/products/questions`, question);
  }

  // Related products (by category)
  getRelatedProducts(productId: number, categoryId?: number): Observable<Producto[]> {
    const cat = categoryId ? `?categoryId=${categoryId}` : '';
    return this.get<Producto[]>(`/products/${productId}/related${cat}`);
  }

  // Public endpoints used by product-list
  getProductsByCategory(categoryId: number): Observable<any> {
    return this.get<any>(`/products/category/${categoryId}?page=0&size=12`);
  }

  getProductsByBrand(brandId: number): Observable<any> {
    return this.get<any>(`/products?brandId=${brandId}&page=0&size=12`);
  }

  searchProducts(query: string): Observable<any> {
    return this.get<any>(`/products?q=${encodeURIComponent(query)}&page=0&size=12`);
  }

  // Brands (cached — reference data that rarely changes)
  getBrands(): Observable<Marca[]> {
    if (!this.brandsCache$) {
      this.brandsCache$ = this.get<Marca[]>(`/brands`).pipe(shareReplay(1));
    }
    return this.brandsCache$;
  }

  getBrandById(id: number): Observable<Marca> {
    return this.get<Marca>(`/brands/${id}`);
  }

  // Categories (cached — reference data that rarely changes)
  getCategories(): Observable<Categoria[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.get<Categoria[]>(`/categories`).pipe(shareReplay(1));
    }
    return this.categoriesCache$;
  }

  getCategoryById(id: number): Observable<Categoria> {
    return this.get<Categoria>(`/categories/${id}`);
  }

  getSubCategories(parentId: number): Observable<Categoria[]> {
    return this.get<Categoria[]>(`/categories/${parentId}/subcategories`);
  }

  // Trending
  getTrendingProducts(): Observable<Producto[]> {
    return this.get<Producto[]>(`/products/trending`);
  }

  getDiscountedProducts(): Observable<Producto[]> {
    return this.get<Producto[]>(`/products/discounted`);
  }

  getNewProducts(): Observable<Producto[]> {
    return this.get<Producto[]>(`/products/new`);
  }

  // Admin — obtiene TODOS los productos (activos e inactivos)
  getAdminProducts(filters: any = {}, page: number = 0, size: number = 1000): Observable<any> {
    const params: string[] = [];
    if (filters.categoryId) params.push(`categoryId=${filters.categoryId}`);
    if (filters.brandId) params.push(`brandId=${filters.brandId}`);
    if (filters.query) params.push(`q=${encodeURIComponent(filters.query)}`);
    if (filters.isActive != null) params.push(`isActive=${filters.isActive}`);
    params.push(`page=${page}`);
    params.push(`size=${size}`);
    const queryString = params.length ? `?${params.join('&')}` : '';
    return this.get<any>(`/products/admin${queryString}`);
  }

  // Admin CRUD
  createProduct(payload: any): Observable<Producto> {
    return this.post<Producto>(`/products`, payload);
  }

  updateProduct(id: number, payload: any): Observable<Producto> {
    return this.put<Producto>(`/products/${id}`, payload);
  }

  deleteProduct(id: number): Observable<void> {
    return this.delete<void>(`/products/${id}`);
  }
}

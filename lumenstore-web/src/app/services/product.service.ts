import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  getProducts(page: number = 0, size: number = 10): Observable<any> {
    return this.get<any>(`/products?page=${page}&size=${size}`);
  }

  getProductById(id: number): Observable<ProductoResponseDTO> {
    return this.get<ProductoResponseDTO>(`/products/${id}`);
  }

  searchProducts(query: string): Observable<Producto[]> {
    return this.get<Producto[]>(`/products/search?q=${query}`);
  }

  getProductsByCategory(categoryId: number): Observable<Producto[]> {
    return this.get<Producto[]>(`/products/category/${categoryId}`);
  }

  getProductsByBrand(brandId: number): Observable<Producto[]> {
    return this.get<Producto[]>(`/products/brand/${brandId}`);
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

  askQuestion(question: any): Observable<ProductQuestion> {
    return this.post<ProductQuestion>(`/products/questions`, question);
  }

  // Brands
  getBrands(): Observable<Marca[]> {
    return this.get<Marca[]>(`/brands`);
  }

  getBrandById(id: number): Observable<Marca> {
    return this.get<Marca>(`/brands/${id}`);
  }

  // Categories
  getCategories(): Observable<Categoria[]> {
    return this.get<Categoria[]>(`/categories`);
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

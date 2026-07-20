import { Injectable } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Wishlist, WishlistResponseDTO, WishlistRequestDTO, WishlistItem } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WishlistService extends ApiService {
  private defaultWishlistCache = new Map<number, Observable<WishlistResponseDTO>>();
  private wishlistProductCache = new Map<string, Observable<boolean>>();

  createWishlist(
    customerId: number,
    wishlist: WishlistRequestDTO,
  ): Observable<WishlistResponseDTO> {
    return this.post<WishlistResponseDTO>(`/customers/${customerId}/wishlists`, wishlist);
  }

  getWishlistById(customerId: number, wishlistId: number): Observable<WishlistResponseDTO> {
    return this.get<WishlistResponseDTO>(`/customers/${customerId}/wishlists/${wishlistId}`);
  }

  getWishlistsByCustomer(customerId: number): Observable<WishlistResponseDTO[]> {
    return this.get<WishlistResponseDTO[]>(`/customers/${customerId}/wishlists`);
  }

  updateWishlist(
    customerId: number,
    wishlistId: number,
    wishlist: WishlistRequestDTO,
  ): Observable<WishlistResponseDTO> {
    return this.put<WishlistResponseDTO>(
      `/customers/${customerId}/wishlists/${wishlistId}`,
      wishlist,
    );
  }

  deleteWishlist(customerId: number, wishlistId: number): Observable<void> {
    return this.delete<void>(`/customers/${customerId}/wishlists/${wishlistId}`);
  }

  addProductToWishlist(
    customerId: number,
    wishlistId: number,
    productId: number,
  ): Observable<WishlistItem> {
    return this.post<WishlistItem>(
      `/customers/${customerId}/wishlists/${wishlistId}/products/${productId}`,
      {},
    );
  }

  removeProductFromWishlist(
    customerId: number,
    wishlistId: number,
    productId: number,
  ): Observable<void> {
    return this.delete<void>(
      `/customers/${customerId}/wishlists/${wishlistId}/products/${productId}`,
    );
  }

  getWishlistItems(customerId: number, wishlistId: number): Observable<WishlistItem[]> {
    return this.get<WishlistItem[]>(`/customers/${customerId}/wishlists/${wishlistId}/items`);
  }

  getDefaultWishlist(customerId: number): Observable<WishlistResponseDTO> {
    if (!this.defaultWishlistCache.has(customerId)) {
      const req$ = this.get<WishlistResponseDTO>(
        `/customers/${customerId}/wishlists/default`,
      ).pipe(shareReplay(1));
      this.defaultWishlistCache.set(customerId, req$);
    }
    return this.defaultWishlistCache.get(customerId)!;
  }

  invalidateDefaultWishlist(customerId: number): void {
    this.defaultWishlistCache.delete(customerId);
  }

  isProductInWishlist(
    customerId: number,
    wishlistId: number,
    productId: number,
  ): Observable<boolean> {
    const key = `${wishlistId}:${productId}`;
    if (!this.wishlistProductCache.has(key)) {
      const req$ = this.get<boolean>(
        `/customers/${customerId}/wishlists/${wishlistId}/products/${productId}/exists`,
      ).pipe(shareReplay(1));
      this.wishlistProductCache.set(key, req$);
    }
    return this.wishlistProductCache.get(key)!;
  }

  invalidateWishlistProduct(wishlistId: number, productId?: number): void {
    if (productId != null) {
      this.wishlistProductCache.delete(`${wishlistId}:${productId}`);
    } else {
      for (const key of this.wishlistProductCache.keys()) {
        if (key.startsWith(`${wishlistId}:`)) {
          this.wishlistProductCache.delete(key);
        }
      }
    }
  }
}

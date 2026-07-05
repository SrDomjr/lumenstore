import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Wishlist, WishlistResponseDTO, WishlistRequestDTO, WishlistItem } from '../models';

@Injectable({
  providedIn: 'root',
})
export class WishlistService extends ApiService {
  createWishlist(
    customerId: number,
    wishlist: WishlistRequestDTO,
  ): Observable<WishlistResponseDTO> {
    return this.post<WishlistResponseDTO>(`/customers/${customerId}/wishlists`, wishlist);
  }

  getWishlistById(customerId: number, wishlistId: number): Observable<Wishlist> {
    return this.get<Wishlist>(`/customers/${customerId}/wishlists/${wishlistId}`);
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

  getDefaultWishlist(customerId: number): Observable<Wishlist> {
    return this.get<Wishlist>(`/customers/${customerId}/wishlists/default`);
  }

  isProductInWishlist(
    customerId: number,
    wishlistId: number,
    productId: number,
  ): Observable<boolean> {
    return this.get<boolean>(
      `/customers/${customerId}/wishlists/${wishlistId}/products/${productId}/exists`,
    );
  }
}

import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Carrito, CarritoItem, CarritoItemRequestDTO } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CartService extends ApiService implements OnDestroy {
  private cartSubject = new BehaviorSubject<Carrito | null>(null);
  public cart$ = this.cartSubject.asObservable();

  private destroy$ = new Subject<void>();

  private cartCountSubject = new BehaviorSubject<number>(0);
  public cartCount$ = this.cartCountSubject.asObservable();

  private authService = inject(AuthService);

  constructor(http: HttpClient) {
    super(http);

    // Subscribe to auth changes to reload cart when user logs in
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.loadCart();
      } else {
        this.cartSubject.next(null);
        this.cartCountSubject.next(0);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCart(): void {
    const clientId = this.getClientId();
    if (clientId) {
      this.getCart(clientId).subscribe({
        next: (cart) => {
          this.cartSubject.next(cart);
          this.updateCartCount(cart);
        },
        error: (error) => {
          console.error('Error loading cart:', error);
        },
      });
    }
  }

  getCart(clientId: number): Observable<Carrito> {
    return this.get<Carrito>(`/carrito/cliente/${clientId}`).pipe(
      tap((cart) => {
        this.cartSubject.next(cart);
        this.updateCartCount(cart);
      }),
    );
  }

  addToCart(clientId: number, item: CarritoItemRequestDTO): Observable<Carrito> {
    return this.post<Carrito>(`/carrito/cliente/${clientId}/items`, item).pipe(
      tap((cart) => {
        this.cartSubject.next(cart);
        this.updateCartCount(cart);
      }),
    );
  }

  updateCartItem(clientId: number, itemId: number, quantity: number): Observable<Carrito> {
    return this.patch<Carrito>(`/carrito/cliente/${clientId}/items/${itemId}`, {
      quantity,
    }).pipe(
      tap((cart) => {
        this.cartSubject.next(cart);
        this.updateCartCount(cart);
      }),
    );
  }

  removeFromCart(clientId: number, itemId: number): Observable<Carrito> {
    return this.delete<Carrito>(`/carrito/cliente/${clientId}/items/${itemId}`).pipe(
      tap((cart) => {
        this.cartSubject.next(cart);
        this.updateCartCount(cart);
      }),
    );
  }

  clearCart(clientId: number): Observable<Carrito> {
    return this.delete<Carrito>(`/carrito/cliente/${clientId}`).pipe(
      tap((cart) => {
        this.cartSubject.next(cart);
        this.updateCartCount(cart);
      }),
    );
  }

  getCurrentCart(): Carrito | null {
    return this.cartSubject.value;
  }

  getCartTotal(): number {
    const cart = this.cartSubject.value;
    if (!cart) return 0;
    return cart.items.reduce((total, item) => {
      return total + item.quantity * (item.price || 0);
    }, 0);
  }

  getItemCount(): number {
    return this.cartCountSubject.value;
  }

  private updateCartCount(cart: Carrito): void {
    const count = cart.items ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    this.cartCountSubject.next(count);
  }

  private getClientId(): number | null {
    const user = localStorage.getItem('currentUser');
    if (user) {
      return JSON.parse(user).id;
    }
    return null;
  }
}

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Carrito, CarritoItem, CarritoItemRequestDTO } from '../models';

@Injectable({
  providedIn: 'root',
})
export class CartService extends ApiService {
  private cartSubject = new BehaviorSubject<Carrito | null>(null);
  readonly cart$ = this.cartSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(0);
  readonly cartCount$ = this.cartCountSubject.asObservable();

  private authService = inject(AuthService);

  // ── Drawer state ──────────────────────────────
  private readonly drawerOpen = signal(false);
  readonly drawerOpen$ = new BehaviorSubject<boolean>(false);

  isDrawerOpen(): boolean {
    return this.drawerOpen();
  }

  openDrawer(): void {
    this.drawerOpen.set(true);
    this.drawerOpen$.next(true);
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.drawerOpen$.next(false);
  }

  toggleDrawer(): void {
    if (this.drawerOpen()) {
      this.closeDrawer();
    } else {
      this.openDrawer();
    }
  }

  constructor(http: HttpClient) {
    super(http);

    // Reload cart when user logs in
    this.authService.currentUser$.subscribe((user) => {
      if (user) {
        this.loadCart();
      } else {
        this.cartSubject.next(null);
        this.cartCountSubject.next(0);
      }
    });
  }

  loadCart(): void {
    const clientId = this.getClientId();
    if (clientId) {
      this.getCart(clientId).subscribe({
        error: () => console.error('Error loading cart'),
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
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => total + item.quantity * (item.price || 0), 0);
  }

  getItemCount(): number {
    return this.cartCountSubject.value;
  }

  private updateCartCount(cart: Carrito): void {
    const count = cart.items ? cart.items.reduce((total, item) => total + item.quantity, 0) : 0;
    this.cartCountSubject.next(count);
  }

  private getClientId(): number | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }
}

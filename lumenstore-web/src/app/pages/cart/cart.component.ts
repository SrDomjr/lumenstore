import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { Carrito } from '../../models';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  cart: Carrito | null = null;
  loading = false;

  constructor(
    private cartService: CartService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe((cart) => {
      this.cart = cart;
      this.cdr.detectChanges();
    });
    // Load cart if user is logged in
    this.cartService.loadCart();
  }

  getSubtotal(): number {
    if (!this.cart || !this.cart.items) return 0;
    return this.cart.items.reduce((total, item) => {
      return total + item.quantity * (item.price || 0);
    }, 0);
  }

  updateQuantity(itemId: number, quantity: number) {
    const clientId = this.getClientId();
    if (clientId) {
      this.cartService.updateCartItem(clientId, itemId, quantity).subscribe();
    }
  }

  removeItem(itemId: number) {
    const clientId = this.getClientId();
    if (clientId) {
      this.cartService.removeFromCart(clientId, itemId).subscribe();
    }
  }

  checkout() {
    this.router.navigate(['/checkout']);
  }

  private getClientId(): number | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user).id : null;
  }
}

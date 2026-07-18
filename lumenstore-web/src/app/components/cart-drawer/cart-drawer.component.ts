import {
  Component,
  inject,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { CloudinaryUrlPipe } from '../../pipes/cloudinary-url.pipe';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { CarritoItem } from '../../models';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CloudinaryUrlPipe],
  templateUrl: './cart-drawer.component.html',
  styleUrls: ['./cart-drawer.component.scss'],
})
export class CartDrawerComponent implements AfterViewInit {
  private cartService = inject(CartService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  @ViewChild('itemsContainer') itemsContainer!: ElementRef<HTMLDivElement>;

  readonly cart$ = this.cartService.cart$;
  readonly isOpen$ = this.cartService.drawerOpen$;

  maxStock = signal(10);
  freeShippingThreshold = 150;

  couponOpen = false;
  couponCode = '';

  ngAfterViewInit(): void {
    this.cartService.drawerOpen$.subscribe((open) => {
      if (open) {
        setTimeout(() => this.scrollToLastItem(), 150);
      }
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cart-backdrop')) {
      this.close();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.cartService.isDrawerOpen()) {
      this.close();
    }
  }

  close(): void {
    this.cartService.closeDrawer();
  }

  private scrollToLastItem(): void {
    const container = this.itemsContainer?.nativeElement;
    if (!container) return;
    const items = container.querySelectorAll<HTMLElement>('.cart-item');
    if (items.length > 0) {
      const last = items[items.length - 1];
      last.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      last.classList.add('item-highlight');
      setTimeout(() => last.classList.remove('item-highlight'), 1200);
    }
  }

  getSubtotal(cart: { items?: CarritoItem[] } | null): number {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
  }

  getTotalDiscount(cart: { items?: CarritoItem[] } | null): number {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => {
      const compare = item.compareAtPrice || 0;
      if (compare > item.price) {
        return sum + (compare - item.price) * item.quantity;
      }
      return sum;
    }, 0);
  }

  getProgressPercent(cart: { items?: CarritoItem[] } | null): number {
    const subtotal = this.getSubtotal(cart);
    return Math.min((subtotal / this.freeShippingThreshold) * 100, 100);
  }

  getMissingForFreeShipping(cart: { items?: CarritoItem[] } | null): number {
    const subtotal = this.getSubtotal(cart);
    return Math.max(this.freeShippingThreshold - subtotal, 0);
  }

  increaseQty(item: CarritoItem): void {
    const clientId = this.cartService.getCurrentCart()?.clienteId;
    if (!clientId) return;
    if (item.quantity >= this.maxStock()) {
      this.notification.warning('Stock máximo alcanzado');
      return;
    }
    this.cartService
      .updateCartItem(clientId, item.id, item.quantity + 1)
      .subscribe({ error: () => this.notification.error('Error al actualizar cantidad') });
  }

  decreaseQty(item: CarritoItem): void {
    if (item.quantity <= 1) return;
    const clientId = this.cartService.getCurrentCart()?.clienteId;
    if (!clientId) return;
    this.cartService
      .updateCartItem(clientId, item.id, item.quantity - 1)
      .subscribe({ error: () => this.notification.error('Error al actualizar cantidad') });
  }

  removeItem(item: CarritoItem): void {
    const clientId = this.cartService.getCurrentCart()?.clienteId;
    if (!clientId) return;
    this.cartService.removeFromCart(clientId, item.id).subscribe({
      next: () => this.notification.info(`"${item.productName}" eliminado`),
      error: () => this.notification.error('No se pudo eliminar el producto'),
    });
  }

  goToCheckout(): void {
    this.close();
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    this.close();
    this.router.navigate(['/store']);
  }

  toggleCoupon(): void {
    this.couponOpen = !this.couponOpen;
  }

  applyCoupon(): void {
    if (this.couponCode.trim()) {
      this.notification.info('Cupón aplicado');
    }
  }

  trackByItemId(_index: number, item: CarritoItem): number {
    return item.id;
  }

  getComparePrice(item: CarritoItem): number | null {
    return item.compareAtPrice ?? null;
  }

  getDiscountPercent(item: CarritoItem): number | null {
    if (!item.compareAtPrice || item.compareAtPrice <= item.price) return null;
    return Math.round(((item.compareAtPrice - item.price) / item.compareAtPrice) * 100);
  }

  formatPrice(price: number): string {
    return `S/ ${price.toFixed(2)}`;
  }
}

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
import { RouterModule, Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { NotificationService } from '../../services/notification.service';
import { CarritoItem } from '../../models';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  /** Stock máximo por ítem (fallback a 10 mientras se obtiene del backend) */
  maxStock = signal(10);

  ngAfterViewInit(): void {
    this.cartService.drawerOpen$.subscribe((open) => {
      if (open) {
        setTimeout(() => this.scrollToLastItem(), 150);
      }
    });
  }

  /** Cierra el drawer al hacer clic en el backdrop */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('cart-backdrop')) {
      this.close();
    }
  }

  /** Cierra con tecla Escape */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.cartService.isDrawerOpen()) {
      this.close();
    }
  }

  close(): void {
    this.cartService.closeDrawer();
  }

  /** Scroll automático al último ítem agregado */
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

  /** Obtener el subtotal del carrito */
  getSubtotal(cart: { items?: CarritoItem[] } | null): number {
    if (!cart?.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
  }

  /** Incrementar cantidad (respetando stock máximo) */
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

  /** Decrementar cantidad (mínimo 1) */
  decreaseQty(item: CarritoItem): void {
    if (item.quantity <= 1) return;
    const clientId = this.cartService.getCurrentCart()?.clienteId;
    if (!clientId) return;
    this.cartService
      .updateCartItem(clientId, item.id, item.quantity - 1)
      .subscribe({ error: () => this.notification.error('Error al actualizar cantidad') });
  }

  /** Eliminar ítem con notificación de deshacer */
  removeItem(item: CarritoItem): void {
    const clientId = this.cartService.getCurrentCart()?.clienteId;
    if (!clientId) return;

    const previousCart = this.cartService.getCurrentCart();

    this.cartService.removeFromCart(clientId, item.id).subscribe({
      next: () => {
        this.notification.info(`"${item.productName}" eliminado`, 'Producto eliminado');
      },
      error: () => this.notification.error('No se pudo eliminar el producto'),
    });
  }

  /** Navegar al checkout */
  goToCheckout(): void {
    this.close();
    this.router.navigate(['/checkout']);
  }

  /** TrackBy para rendimiento en *ngFor */
  trackByItemId(_index: number, item: CarritoItem): number {
    return item.id;
  }

  /** Obtener precio comparativo (descuento) del ítem */
  getComparePrice(item: CarritoItem): number | null {
    return item.compareAtPrice ?? null;
  }

  /** Formatear precio en Soles */
  formatPrice(price: number): string {
    return `S/. ${price.toFixed(2)}`;
  }
}

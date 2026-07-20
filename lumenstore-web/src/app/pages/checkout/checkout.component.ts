import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { AddressService } from '../../services/address.service';
import { SaleService } from '../../services/sale.service';
import { NotificationService } from '../../services/notification.service';
import { Carrito, CarritoItem, DireccionResponseDTO, AuthResponse } from '../../models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  user: AuthResponse | null = null;
  cart: Carrito | null = null;
  addresses: DireccionResponseDTO[] = [];
  selectedAddressId: number | null = null;

  shippingMethod = 'standard';
  shippingOptions = [
    { value: 'standard', label: 'Envío estándar', time: 'Llega en 3–5 días hábiles', price: 15 },
    { value: 'express', label: 'Envío express', time: 'Llega en 24–48 horas', price: 30 },
  ];

  paymentMethod = 'card';
  paymentMethods = [
    { value: 'card', label: 'Tarjeta de crédito/débito' },
    { value: 'yape', label: 'Yape' },
    { value: 'plin', label: 'Plin' },
    { value: 'transfer', label: 'Transferencia bancaria' },
    { value: 'paypal', label: 'PayPal' },
  ];

  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardName = '';

  orderNotes = '';

  loading = false;
  loadingAddresses = false;
  submitting = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private addressService: AddressService,
    private saleService: SaleService,
    private notify: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.cartService.cart$.pipe(takeUntil(this.destroy$)).subscribe((cart) => {
      this.cart = cart;
      if (!cart || !cart.items?.length) {
        this.router.navigate(['/cart']);
      }
      this.cdr.detectChanges();
    });

    if (this.user) {
      this.loadAddresses();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAddresses(): void {
    this.loadingAddresses = true;
    this.addressService.getAddressesByCustomer(this.user!.id).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        const defaultAddr = addresses.find((a) => a.isDefault);
        if (defaultAddr) {
          this.selectedAddressId = defaultAddr.id;
        } else if (addresses.length) {
          this.selectedAddressId = addresses[0].id;
        }
        this.loadingAddresses = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingAddresses = false;
        this.cdr.detectChanges();
      },
    });
  }

  selectAddress(id: number): void {
    this.selectedAddressId = id;
  }

  selectShipping(value: string): void {
    this.shippingMethod = value;
  }

  selectPayment(value: string): void {
    this.paymentMethod = value;
  }

  get items(): CarritoItem[] {
    return this.cart?.items || [];
  }

  get subtotal(): number {
    return this.items.reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
  }

  get discountAmount(): number {
    return this.items.reduce((sum, item) => {
      if (item.compareAtPrice && item.compareAtPrice > item.price) {
        return sum + item.quantity * (item.compareAtPrice - item.price);
      }
      return sum;
    }, 0);
  }

  get shippingCost(): number {
    const opt = this.shippingOptions.find((o) => o.value === this.shippingMethod);
    return opt?.price || 0;
  }

  get total(): number {
    return this.subtotal + this.shippingCost;
  }

  get selectedAddress(): DireccionResponseDTO | undefined {
    return this.addresses.find((a) => a.id === this.selectedAddressId);
  }

  get canSubmit(): boolean {
    return (
      !!this.cart &&
      this.items.length > 0 &&
      this.selectedAddressId !== null &&
      !this.submitting
    );
  }

  trackById(_index: number, item: CarritoItem): number {
    return item.id;
  }

  formatAddress(addr: DireccionResponseDTO): string {
    return `${addr.street} · ${addr.city}, ${addr.state} · ${addr.country}`;
  }

  getVariantLabel(item: CarritoItem): string {
    const parts: string[] = [];
    if (item.size) parts.push(item.size);
    if (item.color) parts.push(item.color);
    return parts.join(' · ');
  }

  placeOrder(): void {
    if (!this.canSubmit || !this.user || !this.cart) return;

    this.submitting = true;
    this.cdr.detectChanges();

    const saleRequest = {
      customerId: this.user.id,
      items: this.items.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        discountAmount: 0,
      })),
      discountAmount: 0,
      shippingCost: this.shippingCost,
      paymentMethod: this.paymentMethod,
      notes: this.orderNotes,
    };

    this.saleService.createSale(saleRequest).subscribe({
      next: (response) => {
        this.cartService.clearCart(this.user!.id).subscribe({ error: () => {} });
        this.notify.success('Pedido realizado correctamente', '¡Compra exitosa!');
        this.submitting = false;
        this.router.navigate(['/orders', response.id]);
      },
      error: (err) => {
        this.submitting = false;
        this.notify.apiError(err, 'No se pudo procesar el pedido.', 'Error');
        this.cdr.detectChanges();
      },
    });
  }
}

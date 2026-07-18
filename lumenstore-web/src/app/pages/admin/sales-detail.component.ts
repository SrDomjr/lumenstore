import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../services/sale.service';
import {
  ISale,
  ISaleDetail,
  IShipment,
  IPaymentTransaction,
  IVoucher,
  SaleStatus,
  ShipmentStatus,
  PaymentTransactionStatus,
  VoucherType,
  SALE_STATUS_CONFIG,
  SALE_STATUS_TRANSITIONS,
  SHIPMENT_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '../../models/sales';
import {
  getMockSaleById,
  getMockItemsBySaleId,
  getMockShipmentsBySaleId,
  getMockPaymentsBySaleId,
  getMockVouchersBySaleId,
} from '../../models/sales.mock';

@Component({
  selector: 'app-admin-sales-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sales-detail.component.html',
  styleUrls: ['./sales-detail.component.scss'],
})
export class AdminSalesDetailComponent implements OnInit {
  // ── Data ──
  order: ISale | null = null;
  items: ISaleDetail[] = [];
  shipments: IShipment[] = [];
  payments: IPaymentTransaction[] = [];
  vouchers: IVoucher[] = [];
  loading = false;
  error: string | null = null;
  activeTab: 'items' | 'shipments' | 'payments' = 'items';

  // ── Expose configs ──
  readonly statusConfig = SALE_STATUS_CONFIG;
  readonly shipmentConfig = SHIPMENT_STATUS_CONFIG;
  readonly paymentConfig = PAYMENT_STATUS_CONFIG;
  readonly statusTransitions = SALE_STATUS_TRANSITIONS;

  // ── New shipment form ──
  showShipmentForm = false;
  newShipment = {
    carrier: '',
    trackingNumber: '',
  };
  shipmentError: string | null = null;

  // ── Voucher generation ──
  selectedVoucherType: VoucherType = 'boleta';
  voucherLoading = false;
  voucherError: string | null = null;

  // ── Collapsible JSON ──
  expandedPaymentId: number | null = null;

  // ── Clipboard feedback ──
  copiedField: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private saleService: SaleService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((p) => {
      const id = +p['id'];
      if (id) this.loadAll(id);
    });
  }

  loadAll(saleId: number) {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    // Load sale + details
    this.saleService.getSaleById(saleId).subscribe({
      next: (sale: any) => {
        this.setOrderData(sale);
      },
      error: () => {
        // Fallback to mock
        const mock = getMockSaleById(saleId);
        if (mock) {
          this.setOrderData(mock);
        } else {
          this.error = 'Pedido no encontrado.';
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    // Load shipments
    this.saleService.getShipments(saleId).subscribe({
      next: (res: any) => {
        this.shipments = Array.isArray(res) ? res : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.shipments = getMockShipmentsBySaleId(saleId);
        this.cdr.detectChanges();
      },
    });

    // Load payments
    this.saleService.getPaymentTransactions(saleId).subscribe({
      next: (res: any) => {
        this.payments = Array.isArray(res) ? res : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.payments = getMockPaymentsBySaleId(saleId);
        this.cdr.detectChanges();
      },
    });

    // Load voucher
    this.saleService.getVoucher(saleId).subscribe({
      next: (res: any) => {
        this.vouchers = res ? [res] : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.vouchers = getMockVouchersBySaleId(saleId);
        this.cdr.detectChanges();
      },
    });

    // Simulate loading complete (in case API fails silently)
    setTimeout(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }, 800);
  }

  private setOrderData(sale: any) {
    this.order = sale;
    this.items = sale.items ?? getMockItemsBySaleId(sale.id);
    this.loading = false;
    this.cdr.detectChanges();
  }

  // ── State Machine ──
  get currentStatus(): SaleStatus {
    return this.order?.status ?? 'pending';
  }

  get allowedTransitions(): SaleStatus[] {
    return this.statusTransitions[this.currentStatus] ?? [];
  }

  get isReadOnly(): boolean {
    return this.currentStatus === 'cancelled' || this.currentStatus === 'delivered';
  }

  get statusSteps(): SaleStatus[] {
    const steps: SaleStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered'];
    return steps;
  }

  get currentStepIndex(): number {
    return this.statusSteps.indexOf(this.currentStatus);
  }

  isStepCompleted(step: SaleStatus): boolean {
    return this.statusSteps.indexOf(step) <= this.currentStepIndex;
  }

  isStepCurrent(step: SaleStatus): boolean {
    return step === this.currentStatus;
  }

  transitionTo(newStatus: SaleStatus) {
    if (!this.order || !this.allowedTransitions.includes(newStatus)) return;

    this.saleService.updateSaleStatus(this.order.id, newStatus).subscribe({
      next: (updated: any) => {
        this.order = { ...this.order!, status: newStatus as SaleStatus };
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error actualizando estado.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Shipments ──
  get canAddShipment(): boolean {
    return (
      !this.isReadOnly && (this.currentStatus === 'processing' || this.currentStatus === 'shipped')
    );
  }

  canMarkInTransit(shipment: IShipment): boolean {
    return shipment.status === 'pending' && !!shipment.carrier && !!shipment.trackingNumber;
  }

  canMarkDelivered(shipment: IShipment): boolean {
    return shipment.status === 'in_transit';
  }

  toggleShipmentForm() {
    this.showShipmentForm = !this.showShipmentForm;
    this.shipmentError = null;
    if (!this.showShipmentForm) {
      this.newShipment = { carrier: '', trackingNumber: '' };
    }
  }

  saveShipment() {
    this.shipmentError = null;

    // Validation: carrier and tracking required
    if (!this.newShipment.carrier.trim() || !this.newShipment.trackingNumber.trim()) {
      this.shipmentError = 'El transportista y número de rastreo son obligatorios.';
      return;
    }

    if (!this.order) return;

    // Optimistic: add to local list
    const tempShipment: IShipment = {
      id: Date.now(),
      saleId: this.order.id,
      trackingNumber: this.newShipment.trackingNumber.trim(),
      carrier: this.newShipment.carrier.trim(),
      status: 'pending',
      shippedAt: new Date().toISOString(),
      deliveredAt: '',
    };

    this.shipments = [...this.shipments, tempShipment];
    this.showShipmentForm = false;
    this.newShipment = { carrier: '', trackingNumber: '' };
    this.cdr.detectChanges();
  }

  updateShipmentStatus(shipment: IShipment, newStatus: ShipmentStatus) {
    this.saleService.updateShipmentStatus(shipment.id, newStatus).subscribe({
      next: () => {
        this.shipments = this.shipments.map((s) =>
          s.id === shipment.id
            ? {
                ...s,
                status: newStatus,
                deliveredAt: newStatus === 'delivered' ? new Date().toISOString() : s.deliveredAt,
              }
            : s,
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error actualizando envío.';
        this.cdr.detectChanges();
      },
    });
  }

  // ── Payments ──
  get failedPayments(): IPaymentTransaction[] {
    return this.payments.filter((p) => p.status === 'failed');
  }

  toggleJson(paymentId: number) {
    this.expandedPaymentId = this.expandedPaymentId === paymentId ? null : paymentId;
  }

  parseJson(data: string): string {
    try {
      return JSON.stringify(JSON.parse(data), null, 2);
    } catch {
      return data;
    }
  }

  // ── Vouchers ──
  get canGenerateVoucher(): boolean {
    if (!this.order) return false;
    // nota_credito only allowed if cancelled or refunded
    if (this.selectedVoucherType === 'nota_credito') {
      return this.currentStatus === 'cancelled' || this.currentStatus === 'refunded';
    }
    return !this.isReadOnly;
  }

  get voucherTypeWarning(): string | null {
    if (
      this.selectedVoucherType === 'nota_credito' &&
      this.currentStatus !== 'cancelled' &&
      this.currentStatus !== 'refunded'
    ) {
      return 'Nota de crédito solo disponible para pedidos cancelados o reembolsados.';
    }
    return null;
  }

  generateVoucher() {
    if (!this.order || !this.canGenerateVoucher) return;

    this.voucherLoading = true;
    this.voucherError = null;

    this.saleService.generateVoucher(this.order.id, this.selectedVoucherType).subscribe({
      next: (voucher: any) => {
        this.vouchers = [voucher];
        this.voucherLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.voucherError = 'Error generando comprobante.';
        this.voucherLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  downloadVoucher(voucherId: number) {
    this.saleService.downloadVoucherPDF(voucherId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voucher-${voucherId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {},
    });
  }

  // ── Clipboard ──
  copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    this.copiedField = field;
    setTimeout(() => {
      this.copiedField = null;
    }, 1500);
  }

  // ── TrackBy ──
  trackById(_index: number, item: any): number {
    return item.id;
  }
}

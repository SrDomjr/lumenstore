import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { SaleResponseDTO, SaleDetail, Shipment, Voucher } from '../../models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  order: SaleResponseDTO | null = null;
  items: SaleDetail[] = [];
  shipments: Shipment[] = [];
  voucher: Voucher | null = null;
  loading = true;

  timelineSteps = [
    { key: 'pending', label: 'Confirmado' },
    { key: 'processing', label: 'Preparando' },
    { key: 'shipped', label: 'Enviado' },
    { key: 'delivered', label: 'Entregado' },
  ];

  statusOrder = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

  constructor(
    private saleService: SaleService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.loadOrder(+params['id']);
    });
  }

  loadOrder(id: number) {
    this.loading = true;
    this.saleService.getSaleById(id).subscribe({
      next: (order) => {
        this.order = order;
        this.loadExtras(id);
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadExtras(id: number) {
    this.saleService.getSaleDetails(id).subscribe({
      next: (items) => {
        this.items = items;
        this.loadShipments(id);
      },
      error: () => {
        this.loadShipments(id);
      },
    });
  }

  private loadShipments(id: number) {
    this.saleService.getShipments(id).subscribe({
      next: (shipments) => {
        this.shipments = shipments;
        this.loadVoucher(id);
      },
      error: () => {
        this.loadVoucher(id);
      },
    });
  }

  private loadVoucher(id: number) {
    this.saleService.getVoucher(id).subscribe({
      next: (voucher) => {
        this.voucher = voucher;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getTimelineIndex(): number {
    if (!this.order) return -1;
    if (this.order.status === 'cancelled' || this.order.status === 'refunded') return -1;
    const idx = this.statusOrder.indexOf(this.order.status);
    return idx;
  }

  isStepDone(stepIndex: number): boolean {
    return stepIndex <= this.getTimelineIndex();
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      processing: 'Preparando',
      shipped: 'En camino',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'status-pending',
      paid: 'status-processing',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled',
      refunded: 'status-cancelled',
    };
    return map[status] || 'status-pending';
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  formatDateShort(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  getPaymentMethodLabel(method: string): string {
    const map: Record<string, string> = {
      card: 'Tarjeta',
      transfer: 'Transferencia',
      cash: 'Efectivo',
      paypal: 'PayPal',
      yape: 'Yape',
      plin: 'Plin',
    };
    return map[method] || method;
  }

  getShipment(): Shipment | null {
    return this.shipments.length > 0 ? this.shipments[0] : null;
  }

  goBack() {
    this.router.navigate(['/orders']);
  }
}

import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SaleService } from '../../services/sale.service';
import { NotificationService } from '../../services/notification.service';
import { SaleResponseDTO } from '../../models';
import { AdminPageHeaderComponent } from '../../components/admin/admin-page-header.component';
import { AdminButtonComponent } from '../../components/admin/admin-button.component';
import { AdminBadgeComponent } from '../../components/admin/admin-badge.component';


interface StatusConfig {
  value: string;
  label: string;
  badge: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
}

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AdminPageHeaderComponent,
    AdminButtonComponent,
    AdminBadgeComponent,
  ],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class AdminOrdersComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  orders: SaleResponseDTO[] = [];
  allOrders: SaleResponseDTO[] = [];
  loading = false;
  error: string | null = null;

  searchTerm = '';
  statusFilter = 'all';
  startDate: string | null = null;
  endDate: string | null = null;

  page = 0;
  size = 25;
  totalElements = 0;
  totalPages = 0;

  readonly statusOptions: StatusConfig[] = [
    { value: 'pending', label: 'Pendiente', badge: 'pending' },
    { value: 'paid', label: 'Pagado', badge: 'paid' },
    { value: 'processing', label: 'Procesando', badge: 'processing' },
    { value: 'shipped', label: 'Enviado', badge: 'shipped' },
    { value: 'delivered', label: 'Entregado', badge: 'delivered' },
    { value: 'cancelled', label: 'Cancelado', badge: 'cancelled' },
    { value: 'refunded', label: 'Reembolsado', badge: 'refunded' },
  ];

  readonly paymentLabels: Record<string, string> = {
    card: 'Tarjeta',
    transfer: 'Transferencia',
    cash: 'Efectivo',
    paypal: 'PayPal',
    yape: 'Yape',
    plin: 'Plin',
  };

  constructor(
    private saleService: SaleService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.load();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    if (this.startDate && this.endDate) {
      this.saleService.getSalesReport(this.startDate, this.endDate)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.allOrders = res || [];
            this.totalElements = this.allOrders.length;
            this.totalPages = Math.ceil(this.totalElements / this.size) || 1;
            this.applyClientFilters();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.error = 'Error obteniendo el reporte de ventas.';
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
      return;
    }

    if (this.statusFilter && this.statusFilter !== 'all') {
      this.saleService.getSalesByStatus(this.statusFilter)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.allOrders = res || [];
            this.totalElements = this.allOrders.length;
            this.totalPages = Math.ceil(this.totalElements / this.size) || 1;
            this.page = 0;
            this.applyClientFilters();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: () => {
            this.error = 'No se pudieron cargar los pedidos.';
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
      return;
    }

    this.saleService.getAllSales(this.page, this.size)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          this.allOrders = resp?.content || resp || [];
          this.totalElements = resp?.totalElements ?? this.allOrders.length;
          this.totalPages = resp?.totalPages ?? (Math.ceil(this.totalElements / this.size) || 1);
          this.applyClientFilters();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'No se pudieron cargar los pedidos.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private applyClientFilters() {
    let filtered = [...this.allOrders];

    if (this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          String(o.orderNumber || '').toLowerCase().includes(q) ||
          String(o.customerName || '').toLowerCase().includes(q),
      );
    }

    this.orders = filtered;
  }

  applyFilters() {
    this.page = 0;
    this.load();
  }

  onSearchChange() {
    this.page = 0;
    if (this.statusFilter !== 'all' || (this.startDate && this.endDate)) {
      this.applyClientFilters();
    } else {
      this.load();
    }
  }

  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.load();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.load();
    }
  }

  view(orderId: number) {
    this.router.navigate(['/admin/orders', orderId]);
  }

  getStatusLabel(status: string): string {
    return this.statusOptions.find((s) => s.value === status)?.label || status;
  }

  getStatusBadge(status: string): StatusConfig['badge'] {
    return this.statusOptions.find((s) => s.value === status)?.badge || 'pending';
  }

  formatPayment(method: string): string {
    return this.paymentLabels[method] || method;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  trackByOrderId(_index: number, order: SaleResponseDTO): number {
    return order.id;
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.startDate = null;
    this.endDate = null;
    this.page = 0;
    this.load();
  }
}

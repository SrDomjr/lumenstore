import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SaleService } from '../../services/sale.service';
import { NotificationService } from '../../services/notification.service';
import { SaleResponseDTO, SaleDetailResponseDTO } from '../../models';
import { AdminPageHeaderComponent } from '../../components/admin/admin-page-header.component';
import { AdminButtonComponent } from '../../components/admin/admin-button.component';
import { AdminBadgeComponent } from '../../components/admin/admin-badge.component';

interface StatusConfig {
  value: string;
  label: string;
  badge: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
}

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AdminPageHeaderComponent,
    AdminButtonComponent,
    AdminBadgeComponent,
  ],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class AdminOrderDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  order: SaleResponseDTO | null = null;
  loading = false;
  updatingStatus = false;
  cancelling = false;

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
    private route: ActivatedRoute,
    private saleService: SaleService,
    private cdr: ChangeDetectorRef,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe((p) => {
        const id = +p['id'];
        if (id) this.load(id);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(id: number) {
    this.loading = true;
    this.cdr.detectChanges();

    this.saleService.getSaleById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (o) => {
          this.order = o;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.order = null;
          this.loading = false;
          this.notify.error('No se pudo cargar el pedido.', 'Error');
          this.cdr.detectChanges();
        },
      });
  }

  updateStatus(status: string) {
    if (!this.order || this.updatingStatus) return;
    this.updatingStatus = true;
    this.cdr.detectChanges();

    this.saleService.updateSaleStatus(this.order.id, status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.order = updated;
          this.updatingStatus = false;
          this.notify.success('Estado actualizado correctamente.', 'Pedido actualizado');
          this.cdr.detectChanges();
        },
        error: () => {
          this.updatingStatus = false;
          this.notify.error('No se pudo actualizar el estado.', 'Error');
          this.cdr.detectChanges();
        },
      });
  }

  cancelOrder() {
    if (!this.order || this.cancelling) return;
    this.cancelling = true;
    this.cdr.detectChanges();

    this.saleService.cancelSale(this.order.id, 'Cancelado por administrador')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.order = updated;
          this.cancelling = false;
          this.notify.success('Pedido cancelado correctamente.', 'Pedido cancelado');
          this.cdr.detectChanges();
        },
        error: () => {
          this.cancelling = false;
          this.notify.error('No se pudo cancelar el pedido.', 'Error');
          this.cdr.detectChanges();
        },
      });
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
    return d.toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  get itemsTotal(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
  }
}

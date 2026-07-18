import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../services/sale.service';
import { ISale, SaleStatus, SALE_STATUS_CONFIG, SALE_STATUS_TRANSITIONS } from '../../models/sales';
import { MOCK_SALES } from '../../models/sales.mock';
import { AdminPageHeaderComponent } from '../../components/admin/admin-page-header.component';
import { AdminButtonComponent } from '../../components/admin/admin-button.component';
import { AdminBadgeComponent } from '../../components/admin/admin-badge.component';
import { AdminEmptyStateComponent } from '../../components/admin/admin-empty-state.component';
import { AdminSkeletonComponent } from '../../components/admin/admin-skeleton.component';

@Component({
  selector: 'app-admin-sales-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AdminPageHeaderComponent,
    AdminButtonComponent,
    AdminBadgeComponent,
    AdminEmptyStateComponent,
    AdminSkeletonComponent,
  ],
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.scss'],
})
export class AdminSalesListComponent implements OnInit {
  // ── Data ──
  orders: ISale[] = [];
  filteredOrders: ISale[] = [];
  loading = false;
  error: string | null = null;

  // ── Filters ──
  searchTerm = '';
  statusFilter: 'all' | SaleStatus = 'all';
  startDate: string | null = null;
  endDate: string | null = null;
  page = 0;
  size = 25;
  totalPages = 0;
  totalElements = 0;

  // ── Expose config to template ──
  readonly statusConfig = SALE_STATUS_CONFIG;
  readonly statusList: SaleStatus[] = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ];

  constructor(
    private saleService: SaleService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.saleService.getAllSales(this.page, this.size).subscribe({
      next: (resp: any) => {
        const content = resp?.content ?? resp ?? [];
        this.orders = Array.isArray(content) ? content : [];
        this.totalPages = resp?.totalPages ?? 1;
        this.totalElements = resp?.totalElements ?? this.orders.length;
        this.applyClientFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        // Fallback to mock data when API is not available
        this.orders = [...MOCK_SALES];
        this.totalPages = 1;
        this.totalElements = this.orders.length;
        this.applyClientFilter();
        this.loading = false;
        this.error = null;
        this.cdr.detectChanges();
      },
    });
  }

  applyClientFilter() {
    if (!this.searchTerm) {
      this.filteredOrders = [...this.orders];
      return;
    }
    const q = this.searchTerm.toLowerCase();
    this.filteredOrders = (this.orders ?? []).filter(
      (o) =>
        String(o.orderNumber ?? o.id)
          .toLowerCase()
          .includes(q) ||
        String(o.customerName ?? '')
          .toLowerCase()
          .includes(q),
    );
  }

  applyFilters() {
    this.page = 0;
    this.load();
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.startDate = null;
    this.endDate = null;
    this.page = 0;
    this.load();
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
    this.router.navigate(['/admin/sales', orderId]);
  }

  // ── Status helpers ──
  getConfig(status: string) {
    return this.statusConfig[status as SaleStatus] ?? this.statusConfig.pending;
  }

  canTransition(status: SaleStatus): SaleStatus[] {
    return SALE_STATUS_TRANSITIONS[status] ?? [];
  }

  quickStatus(orderId: number, newStatus: string) {
    const status = newStatus as SaleStatus;
    this.saleService.updateSaleStatus(orderId, status).subscribe({
      next: (updated) => {
        const idx = this.orders.findIndex((o) => o.id === orderId);
        if (idx !== -1) {
          this.orders[idx] = { ...this.orders[idx], status };
        }
        this.applyClientFilter();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Error actualizando estado';
        this.cdr.detectChanges();
      },
    });
  }

  // ── TrackBy ──
  trackById(_index: number, item: ISale): number {
    return item.id;
  }

  // ── Clipboard ──
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../services/sale.service';
import { SaleResponseDTO } from '../../models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
  orders: SaleResponseDTO[] = [];
  filteredOrders: SaleResponseDTO[] = [];
  loading = false;

  activeTab = 'all';
  searchQuery = '';
  dateFilter = '3months';

  tabs = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'En proceso' },
    { key: 'delivered', label: 'Entregados' },
    { key: 'cancelled', label: 'Cancelados' },
  ];

  constructor(
    private saleService: SaleService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    const clientId = this.getClientId();
    if (!clientId) return;
    this.loading = true;
    this.saleService.getSalesByCustomer(clientId).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  setTab(key: string) {
    this.activeTab = key;
    this.applyFilters();
  }

  applyFilters() {
    let result = [...this.orders];

    if (this.activeTab === 'active') {
      result = result.filter(o => ['pending', 'paid', 'processing', 'shipped'].includes(o.status));
    } else if (this.activeTab === 'delivered') {
      result = result.filter(o => o.status === 'delivered');
    } else if (this.activeTab === 'cancelled') {
      result = result.filter(o => ['cancelled', 'refunded'].includes(o.status));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter(o => o.orderNumber.toLowerCase().includes(q));
    }

    const now = new Date();
    if (this.dateFilter === '3months') {
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 3);
      result = result.filter(o => new Date(o.createdAt) >= cutoff);
    } else if (this.dateFilter === '1year') {
      const cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      result = result.filter(o => new Date(o.createdAt) >= cutoff);
    }

    this.filteredOrders = result;
  }

  openOrder(id: number) {
    this.router.navigate(['/orders', id]);
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

  getItemCount(order: SaleResponseDTO): number {
    if (order.items && order.items.length) {
      return order.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
    }
    return 0;
  }

  private getClientId(): number | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user).id : null;
  }
}

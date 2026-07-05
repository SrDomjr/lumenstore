import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SaleService } from '../../services/sale.service';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class AdminOrdersComponent implements OnInit {
  orders: any[] = [];
  loading = false;
  error: string | null = null;
  searchTerm = '';
  statusFilter = 'all';
  startDate: string | null = null;
  endDate: string | null = null;
  page = 0;
  size = 25;

  constructor(
    private saleService: SaleService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;

    // If date range provided, use sales report endpoint
    if (this.startDate && this.endDate) {
      this.saleService.getSalesReport(this.startDate, this.endDate).subscribe(
        (res) => {
          this.orders = res || [];
          this.loading = false;
        },
        () => {
          this.error = 'Error obteniendo el reporte de ventas.';
          this.loading = false;
        },
      );
      return;
    }

    // If specific status filter
    if (this.statusFilter && this.statusFilter !== 'all') {
      this.saleService.getSalesByStatus(this.statusFilter).subscribe(
        (res) => {
          this.orders = res || [];
          this.applyClientSearch();
          this.loading = false;
        },
        () => {
          this.error = 'No se pudieron cargar los pedidos.';
          this.loading = false;
        },
      );
      return;
    }

    // Default: paginated all sales
    this.saleService.getAllSales(this.page, this.size).subscribe(
      (resp: any) => {
        this.orders = resp?.content || resp || [];
        this.applyClientSearch();
        this.loading = false;
      },
      () => {
        this.error = 'No se pudieron cargar los pedidos.';
        this.loading = false;
      },
    );
  }

  applyClientSearch() {
    if (!this.searchTerm) return;
    const q = this.searchTerm.toLowerCase();
    this.orders = (this.orders || []).filter(
      (o: any) =>
        String(o.orderNumber || o.id)
          .toLowerCase()
          .includes(q) ||
        String(o.customerName || o.clienteName || '')
          .toLowerCase()
          .includes(q),
    );
  }

  applyFilters() {
    this.page = 0;
    this.load();
  }

  nextPage() {
    this.page++;
    this.load();
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

  changeStatus(orderId: number, status: string) {
    this.saleService.updateSaleStatus(orderId, status).subscribe(
      () => this.load(),
      () => alert('Error actualizando estado'),
    );
  }
}

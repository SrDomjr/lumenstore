import { Component, OnInit, AfterViewInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import Chart from 'chart.js/auto';
import {
  DashboardService,
  DashboardStats,
  DashboardOrder,
  DashboardStockAlert,
  DashboardPendingReview,
} from '../../services/dashboard.service';
import { AdminPageHeaderComponent } from '../../components/admin/admin-page-header.component';
import { AdminButtonComponent } from '../../components/admin/admin-button.component';
import { AdminBadgeComponent } from '../../components/admin/admin-badge.component';
import { AdminCardComponent } from '../../components/admin/admin-card.component';
import { AdminSkeletonComponent } from '../../components/admin/admin-skeleton.component';
import { AdminEmptyStateComponent } from '../../components/admin/admin-empty-state.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AdminPageHeaderComponent,
    AdminButtonComponent,
    AdminBadgeComponent,
    AdminCardComponent,
    AdminSkeletonComponent,
    AdminEmptyStateComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  stats: DashboardStats | null = null;
  loading = true;
  error: string | null = null;
  lastUpdated = '';

  private chart: Chart | null = null;

  kpis = [
    {
      label: 'Ventas de hoy',
      key: 'todaySales' as const,
      isCurrency: true,
      icon: 'fa-solid fa-dollar-sign',
    },
    {
      label: 'Pedidos pendientes',
      key: 'pendingOrders' as const,
      icon: 'fa-solid fa-bag-shopping',
    },
    {
      label: 'Nuevos clientes',
      key: 'newCustomers' as const,
      icon: 'fa-solid fa-user-plus',
    },
    {
      label: 'Conversión',
      key: 'conversionRate' as const,
      isPercent: true,
      icon: 'fa-solid fa-chart-line',
    },
  ];

  constructor(
    private dashboardService: DashboardService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    if (this.stats) {
      this.initChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  loadStats(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getDashboardStats().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.stats = data;
          this.loading = false;
          this.lastUpdated = this.formatRelativeTime(new Date());
          setTimeout(() => this.initChart(), 0);
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error('[Dashboard] Error:', err);
          this.loading = false;
          this.error = 'No se pudieron cargar las métricas del dashboard.';
        });
      },
    });
  }

  getKpiValue(key: string): string {
    if (!this.stats) return '—';
    const val = (this.stats as any)[key];
    if (val === undefined || val === null) return '—';
    return val;
  }

  getKpiTrend(key: string): 'up' | 'down' | 'neutral' {
    if (!this.stats) return 'neutral';
    const trendKey = key + 'Trend';
    return (this.stats as any)[trendKey] || 'neutral';
  }

  formatCurrency(val: number): string {
    return val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatOrderStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      paid: 'Pagado',
      processing: 'Procesando',
      shipped: 'Enviado',
      delivered: 'Entregado',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado',
    };
    return map[status] || status;
  }

  getStatusVariant(status: string): 'pending' | 'processing' | 'completed' | 'cancelled' | 'info' | 'neutral' {
    const map: Record<string, 'pending' | 'processing' | 'completed' | 'cancelled' | 'info' | 'neutral'> = {
      pending: 'pending',
      paid: 'completed',
      processing: 'processing',
      shipped: 'info',
      delivered: 'completed',
      cancelled: 'cancelled',
      refunded: 'cancelled',
    };
    return map[status] || 'neutral';
  }

  formatOrderDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  formatRelativeTime(date: Date): string {
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  getStockStatus(alert: DashboardStockAlert): string {
    if (alert.stock === 0) return 'Sin stock';
    if (alert.stock <= alert.threshold / 2) return 'Crítico';
    return 'Bajo';
  }

  private initChart(): void {
    if (!this.stats?.revenueChart?.length) return;

    this.chart?.destroy();

    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;

    const labels = this.stats.revenueChartLabels || [];
    const data = this.stats.revenueChart;

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Ingresos (S/.)',
            data,
            borderColor: '#111111',
            borderWidth: 1.5,
            tension: 0.3,
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#111111',
            pointBorderWidth: 1.5,
            pointRadius: 3,
            pointHoverRadius: 5,
            fill: true,
            backgroundColor: 'rgba(17, 17, 17, 0.03)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111111',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            titleFont: { family: 'Inter', size: 12, weight: 'bold' as const },
            bodyFont: { family: 'Inter', size: 12 },
            padding: 10,
            cornerRadius: 0,
            displayColors: false,
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#6B6B6B',
            },
          },
          y: {
            grid: { color: '#F0F0F0', tickLength: 0 },
            border: { display: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#6B6B6B',
              padding: 8,
              callback: (val) => 'S/. ' + val,
            },
          },
        },
      },
    });
  }
}

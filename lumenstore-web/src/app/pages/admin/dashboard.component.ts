import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';

export interface KpiMetric {
  label: string;
  value: string;
  isCurrency?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

export interface RecentOrder {
  id: string;
  customer: string;
  date: string;
  total: string;
  status: string;
  statusClass: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  /** Métricas del día (KPIs) */
  kpis: KpiMetric[] = [];
  
  /** Últimos pedidos */
  recentOrders: RecentOrder[] = [];

  ngOnInit(): void {
    // Simular carga de KPIs desde el backend
    this.kpis = [
      { label: 'Ventas de hoy', value: '0.00', isCurrency: true, trend: 'neutral' },
      { label: 'Pedidos pendientes', value: '5', trend: 'up' },
      { label: 'Nuevos usuarios', value: '2', trend: 'up' },
    ];

    // Simular últimos pedidos
    this.recentOrders = [
      { id: '#1005', customer: 'Andrea Valdés', date: 'Hoy, 10:45 AM', total: '145.00', status: 'Pendiente', statusClass: 'pending' },
      { id: '#1004', customer: 'Carlos Gómez', date: 'Ayer, 04:30 PM', total: '89.90', status: 'Completado', statusClass: 'completed' },
      { id: '#1003', customer: 'Lucía Fernández', date: 'Ayer, 11:15 AM', total: '210.50', status: 'Completado', statusClass: 'completed' },
      { id: '#1002', customer: 'Martín Torres', date: '06 Jul, 02:20 PM', total: '45.00', status: 'Completado', statusClass: 'completed' },
      { id: '#1001', customer: 'Sofía Castro', date: '05 Jul, 09:10 AM', total: '320.00', status: 'Completado', statusClass: 'completed' },
    ];
  }

  ngAfterViewInit(): void {
    this.initChart();
  }

  private initChart(): void {
    const canvas = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!canvas) return;

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Ingresos (S/.)',
          data: [120, 190, 150, 220, 180, 250, 310],
          borderColor: '#111111',
          borderWidth: 1.5,
          tension: 0,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#111111',
          pointBorderWidth: 1.5,
          pointRadius: 3,
          pointHoverRadius: 5,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#111111',
            titleFont: { family: 'inherit', size: 12 },
            bodyFont: { family: 'inherit', size: 12 },
            padding: 12,
            cornerRadius: 0,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: { family: 'inherit', size: 11 },
              color: '#999999'
            }
          },
          y: {
            grid: {
              color: '#f0f0f0',
              tickWidth: 0
            },
            border: {
              display: false
            },
            ticks: {
              font: { family: 'inherit', size: 11 },
              color: '#999999',
              padding: 10,
              callback: function(value) {
                return 'S/. ' + value;
              }
            }
          }
        }
      }
    });
  }
}

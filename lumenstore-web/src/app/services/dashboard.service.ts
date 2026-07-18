import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface DashboardStats {
  todaySales: number;
  todaySalesTrend: 'up' | 'down' | 'neutral';
  monthSales: number;
  monthSalesTrend: 'up' | 'down' | 'neutral';
  pendingOrders: number;
  pendingOrdersTrend: 'up' | 'down' | 'neutral';
  newCustomers: number;
  newCustomersTrend: 'up' | 'down' | 'neutral';
  conversionRate: number;
  conversionTrend: 'up' | 'down' | 'neutral';
  revenueChart: number[];
  revenueChartLabels: string[];
  recentOrders: DashboardOrder[];
  stockAlerts: DashboardStockAlert[];
  pendingReviews: DashboardPendingReview[];
}

export interface DashboardOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  createdAt: string;
  total: number;
  status: string;
}

export interface DashboardStockAlert {
  id: number;
  productName: string;
  variantInfo: string;
  stock: number;
  threshold: number;
}

export interface DashboardPendingReview {
  id: number;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService extends ApiService {
  getDashboardStats(): Observable<DashboardStats> {
    return this.get<DashboardStats>('/admin/dashboard/stats');
  }
}

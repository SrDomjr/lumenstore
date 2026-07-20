import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import {
  Sale,
  SaleResponseDTO,
  SaleRequestDTO,
  SaleDetail,
  SaleDetailResponseDTO,
  Shipment,
  PaymentTransaction,
  Voucher,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class SaleService extends ApiService {
  createSale(saleRequest: SaleRequestDTO): Observable<SaleResponseDTO> {
    return this.post<SaleResponseDTO>('/sales', saleRequest);
  }

  getSaleById(id: number): Observable<SaleResponseDTO> {
    return this.get<SaleResponseDTO>(`/sales/${id}`);
  }

  getSalesByCustomer(customerId: number): Observable<SaleResponseDTO[]> {
    return this.get<SaleResponseDTO[]>(`/sales/customer/${customerId}`);
  }

  getAllSales(page: number = 0, size: number = 25): Observable<any> {
    return this.get<any>(`/sales?page=${page}&size=${size}`);
  }

  getSalesByStatus(status: string): Observable<SaleResponseDTO[]> {
    return this.get<SaleResponseDTO[]>(`/sales/status/${status}`);
  }

  updateSaleStatus(id: number, status: string): Observable<SaleResponseDTO> {
    return this.patch<SaleResponseDTO>(`/sales/${id}/status`, { status });
  }

  // Sales Details
  getSaleDetails(saleId: number): Observable<SaleDetailResponseDTO[]> {
    return this.get<SaleDetailResponseDTO[]>(`/sales/${saleId}/details`);
  }

  // Shipments
  getShipments(saleId: number): Observable<Shipment[]> {
    return this.get<Shipment[]>(`/sales/${saleId}/shipments`);
  }

  updateShipmentStatus(shipmentId: number, status: string): Observable<Shipment> {
    return this.patch<Shipment>(`/shipments/${shipmentId}`, { status });
  }

  trackShipment(trackingNumber: string): Observable<Shipment> {
    return this.get<Shipment>(`/shipments/track/${trackingNumber}`);
  }

  // Payments
  getPaymentTransactions(saleId: number): Observable<PaymentTransaction[]> {
    return this.get<PaymentTransaction[]>(`/sales/${saleId}/payments`);
  }

  processPayment(saleId: number, paymentData: any): Observable<PaymentTransaction> {
    return this.post<PaymentTransaction>(`/sales/${saleId}/payments`, paymentData);
  }

  refundPayment(paymentId: number): Observable<PaymentTransaction> {
    return this.post<PaymentTransaction>(`/payments/${paymentId}/refund`, {});
  }

  // Vouchers
  getVoucher(saleId: number): Observable<Voucher> {
    return this.get<Voucher>(`/sales/${saleId}/voucher`);
  }

  generateVoucher(saleId: number, voucherType: string): Observable<Voucher> {
    return this.post<Voucher>(`/sales/${saleId}/voucher`, { voucherType });
  }

  downloadVoucherPDF(voucherId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/vouchers/${voucherId}/pdf`, { responseType: 'blob' });
  }

  // Reports
  getSalesReport(startDate: string, endDate: string): Observable<any> {
    return this.get<any>(`/sales/reports?startDate=${startDate}&endDate=${endDate}`);
  }

  cancelSale(id: number, reason: string): Observable<SaleResponseDTO> {
    return this.patch<SaleResponseDTO>(`/sales/${id}/cancel`, { reason });
  }
}

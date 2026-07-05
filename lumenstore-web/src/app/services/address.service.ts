import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Direccion, DireccionRequestDTO, DireccionResponseDTO } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AddressService extends ApiService {
  createAddress(
    customerId: number,
    address: DireccionRequestDTO,
  ): Observable<DireccionResponseDTO> {
    return this.post<DireccionResponseDTO>(`/customers/${customerId}/addresses`, address);
  }

  getAddressById(customerId: number, addressId: number): Observable<DireccionResponseDTO> {
    return this.get<DireccionResponseDTO>(`/customers/${customerId}/addresses/${addressId}`);
  }

  getAddressesByCustomer(customerId: number): Observable<DireccionResponseDTO[]> {
    return this.get<DireccionResponseDTO[]>(`/customers/${customerId}/addresses`);
  }

  updateAddress(
    customerId: number,
    addressId: number,
    address: DireccionRequestDTO,
  ): Observable<DireccionResponseDTO> {
    return this.put<DireccionResponseDTO>(
      `/customers/${customerId}/addresses/${addressId}`,
      address,
    );
  }

  deleteAddress(customerId: number, addressId: number): Observable<void> {
    return this.delete<void>(`/customers/${customerId}/addresses/${addressId}`);
  }

  setDefaultAddress(customerId: number, addressId: number): Observable<DireccionResponseDTO> {
    return this.patch<DireccionResponseDTO>(
      `/customers/${customerId}/addresses/${addressId}/default`,
      {},
    );
  }

  getDefaultAddress(customerId: number): Observable<DireccionResponseDTO> {
    return this.get<DireccionResponseDTO>(`/customers/${customerId}/addresses/default`);
  }
}

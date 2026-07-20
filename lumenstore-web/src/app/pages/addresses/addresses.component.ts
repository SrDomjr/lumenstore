import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AddressService } from '../../services/address.service';
import { NotificationService } from '../../services/notification.service';
import { DireccionResponseDTO, DireccionRequestDTO, AuthResponse } from '../../models';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss'],
})
export class AddressesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  user: AuthResponse | null = null;
  addresses: DireccionResponseDTO[] = [];
  loading = false;

  // Modals
  showModal = false;
  modalMode: 'add' | 'edit' = 'add';
  showDeleteModal = false;
  deleteTarget: DireccionResponseDTO | null = null;

  // Form
  formStreet = '';
  formCity = '';
  formState = '';
  formPostalCode = '';
  formCountry = 'Perú';
  formAddressType: 'shipping' | 'billing' | 'both' = 'shipping';
  formIsDefault = false;
  editingId: number | null = null;
  saving = false;

  countries = ['Perú', 'Chile', 'Colombia', 'Ecuador', 'Bolivia'];

  constructor(
    private authService: AuthService,
    private addressService: AddressService,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user) {
      this.loadAddresses();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──

  loadAddresses(): void {
    if (!this.user) return;
    this.loading = true;
    this.addressService.getAddressesByCustomer(this.user.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (addresses) => {
        this.addresses = addresses;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ── Add / Edit modal ──

  openAddModal(): void {
    this.modalMode = 'add';
    this.resetForm();
    this.showModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(addr: DireccionResponseDTO): void {
    this.modalMode = 'edit';
    this.editingId = addr.id;
    this.formStreet = addr.street;
    this.formCity = addr.city;
    this.formState = addr.state;
    this.formPostalCode = addr.postalCode;
    this.formCountry = addr.country;
    this.formAddressType = addr.addressType as 'shipping' | 'billing' | 'both';
    this.formIsDefault = addr.isDefault;
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  saveAddress(): void {
    if (!this.user || this.saving) return;
    this.saving = true;

    const payload: DireccionRequestDTO = {
      street: this.formStreet,
      city: this.formCity,
      state: this.formState,
      postalCode: this.formPostalCode,
      country: this.formCountry,
      addressType: this.formAddressType,
      isDefault: this.formIsDefault,
    };

    const op =
      this.modalMode === 'edit' && this.editingId
        ? this.addressService.updateAddress(this.user.id, this.editingId, payload)
        : this.addressService.createAddress(this.user.id, payload);

    op.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.notify.success(
          this.modalMode === 'edit' ? 'Dirección actualizada.' : 'Dirección agregada.',
        );
        this.loadAddresses();
      },
      error: (err) => {
        this.saving = false;
        this.notify.apiError(err, 'No se pudo guardar la dirección.', 'Error');
        this.cdr.detectChanges();
      },
    });
  }

  // ── Delete modal ──

  openDeleteModal(addr: DireccionResponseDTO): void {
    this.deleteTarget = addr;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.deleteTarget = null;
  }

  confirmDelete(): void {
    if (!this.user || !this.deleteTarget || this.saving) return;
    this.saving = true;
    this.addressService.deleteAddress(this.user.id, this.deleteTarget.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.saving = false;
        this.closeDeleteModal();
        this.notify.success('Dirección eliminada.');
        this.loadAddresses();
      },
      error: (err) => {
        this.saving = false;
        this.notify.apiError(err, 'No se pudo eliminar la dirección.', 'Error');
        this.cdr.detectChanges();
      },
    });
  }

  // ── Set default ──

  setDefault(addr: DireccionResponseDTO): void {
    if (!this.user || addr.isDefault) return;
    this.addressService.setDefaultAddress(this.user.id, addr.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.notify.success('Dirección predeterminada actualizada.');
        this.loadAddresses();
      },
      error: (err) => {
        this.notify.apiError(err, 'No se pudo cambiar la dirección predeterminada.', 'Error');
      },
    });
  }

  // ── Helpers ──

  formatAddress(addr: DireccionResponseDTO): string {
    return `${addr.street}\n${addr.city}, ${addr.state} ${addr.postalCode}\n${addr.country}`;
  }

  typeLabel(type: string): string {
    const map: Record<string, string> = {
      shipping: 'Envío',
      billing: 'Facturación',
      both: 'Ambas',
    };
    return map[type] || type;
  }

  private resetForm(): void {
    this.editingId = null;
    this.formStreet = '';
    this.formCity = '';
    this.formState = '';
    this.formPostalCode = '';
    this.formCountry = 'Perú';
    this.formAddressType = 'shipping';
    this.formIsDefault = false;
  }

  trackById(_index: number, addr: DireccionResponseDTO): number {
    return addr.id;
  }
}

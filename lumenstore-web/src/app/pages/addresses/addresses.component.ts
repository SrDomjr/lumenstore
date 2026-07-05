import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddressService } from '../../services/address.service';
import { Direccion } from '../../models';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss'],
})
export class AddressesComponent implements OnInit {
  addresses: Direccion[] = [];
  loading = false;

  constructor(
    private addressService: AddressService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadAddresses();
  }

  loadAddresses() {
    const clientId = this.getClientId();
    if (clientId) {
      this.loading = true;
      this.addressService.getAddressesByCustomer(clientId).subscribe(
        (addresses: any) => {
          this.addresses = addresses;
          this.loading = false;
          this.cdr.detectChanges();
        },
        () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      );
    }
  }

  deleteAddress(id: number) {
    const clientId = this.getClientId();
    if (clientId && confirm('Are you sure?')) {
      this.addressService.deleteAddress(clientId, id).subscribe(() => {
        this.loadAddresses();
      });
    }
  }

  private getClientId(): number | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user).id : null;
  }
}

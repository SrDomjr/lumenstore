import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
  orders: Sale[] = [];
  loading = false;

  constructor(
    private saleService: SaleService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    const clientId = this.getClientId();
    if (clientId) {
      this.loading = true;
      this.saleService.getSalesByCustomer(clientId).subscribe(
        (orders: any) => {
          this.orders = orders;
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

  private getClientId(): number | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user).id : null;
  }
}

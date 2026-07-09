import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SaleService } from '../../services/sale.service';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class AdminOrderDetailComponent implements OnInit {
  order: any = null;
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private saleService: SaleService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.params.subscribe((p) => {
      const id = +p['id'];
      if (id) this.load(id);
    });
  }

  load(id: number) {
    this.loading = true;
    this.cdr.detectChanges();

    this.saleService.getSaleById(id).subscribe(
      (o) => {
        this.order = o;
        this.loading = false;
        this.cdr.detectChanges();
      },
      () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    );
  }

  setStatus(status: string) {
    if (!this.order) return;
    this.saleService.updateSaleStatus(this.order.id, status).subscribe(
      (updated) => {
        this.order = updated;
        this.cdr.detectChanges();
      },
      () => alert('Error actualizando estado'),
    );
  }
}

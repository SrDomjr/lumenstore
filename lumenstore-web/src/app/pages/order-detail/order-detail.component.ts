import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SaleService } from '../../services/sale.service';
import { Sale } from '../../models';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  order: Sale | null = null;
  loading = false;

  constructor(
    private saleService: SaleService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      this.loadOrder(id);
    });
  }

  loadOrder(id: number) {
    this.loading = true;
    this.saleService.getSaleById(id).subscribe(
      (order: any) => {
        this.order = order;
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

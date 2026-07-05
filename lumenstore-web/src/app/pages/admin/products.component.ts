import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class AdminProductsComponent implements OnInit {
  products: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private productService: ProductService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.productService.getProducts(0, 100).subscribe(
      (resp: any) => {
        this.products = resp?.content || resp || [];
        this.loading = false;
      },
      (err) => {
        this.error = 'No se pudieron cargar los productos.';
        this.loading = false;
      },
    );
  }

  edit(id: number) {
    this.router.navigate(['/admin/products', id, 'edit']);
  }

  create() {
    this.router.navigate(['/admin/products', 'new']);
  }

  deleteProduct(id: number) {
    if (!confirm('¿Eliminar producto?')) return;
    this.productService.deleteProduct(id).subscribe(
      () => this.load(),
      () => alert('Error al eliminar el producto.'),
    );
  }
}

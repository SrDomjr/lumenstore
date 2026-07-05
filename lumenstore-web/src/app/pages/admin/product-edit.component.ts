import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-product-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.scss'],
})
export class AdminProductEditComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  isNew = false;
  productId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      isActive: [true],
    });

    this.route.params.subscribe((p) => {
      const id = p['id'];
      if (id === 'new') {
        this.isNew = true;
      } else if (id) {
        this.productId = +id;
        this.loadProduct(this.productId);
      }
    });
  }

  loadProduct(id: number) {
    this.loading = true;
    this.productService.getProductById(id).subscribe(
      (prod) => {
        this.form.patchValue({
          name: prod.name || '',
          description: prod.description || '',
          basePrice: prod.basePrice ?? 0,
          isActive: prod.isActive ?? true,
        });
        this.loading = false;
      },
      () => {
        this.loading = false;
      },
    );
  }

  save() {
    if (this.form.invalid) return;
    const payload = this.form.value;
    this.loading = true;
    if (this.isNew) {
      this.productService.createProduct(payload).subscribe(
        () => this.router.navigate(['/admin/products']),
        () => {
          this.loading = false;
          alert('Error creando producto');
        },
      );
    } else if (this.productId) {
      this.productService.updateProduct(this.productId, payload).subscribe(
        () => this.router.navigate(['/admin/products']),
        () => {
          this.loading = false;
          alert('Error actualizando producto');
        },
      );
    }
  }
}

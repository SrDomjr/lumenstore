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
  brands: any[] = [];
  categories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: [''],
      description: [''],
      shortDescription: [''],
      sku: [''],
      brandId: [null],
      categoryId: [null],
      basePrice: [0, [Validators.required, Validators.min(0)]],
      stock: [0],
      discount: [0],
      featured: [false],
      isActive: [true],
    });

    // Load brands and categories for selects
    this.productService.getBrands().subscribe((bs) => (this.brands = bs || []));
    this.productService.getCategories().subscribe((cs) => (this.categories = cs || []));

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
          slug: prod.slug || '',
          description: prod.description || '',
          shortDescription: prod.shortDescription || '',
          sku: prod.sku || '',
          basePrice: prod.basePrice ?? 0,
          stock: prod.stock ?? 0,
          discount: prod.discount ?? 0,
          featured: prod.featured ?? false,
          isActive: prod.isActive ?? true,
        });
        this.loading = false;
      },
      () => {
        this.loading = false;
        alert('Error al cargar el producto');
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

import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
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
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../services/api.service';
import { QuickCreateModalComponent, QuickCreateType } from './quick-create-modal.component';
import { BrandDTO, CategoryDTO, ColorDTO, SizeDTO } from '../../services/catalog-admin.service';

@Component({
  selector: 'app-admin-product-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    QuickCreateModalComponent,
  ],
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.scss'],
})
export class AdminProductEditComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('tagInput') tagInput!: ElementRef;

  form!: FormGroup;
  loading = false;
  saving = false;
  isNew = false;
  productId: number | null = null;
  productName = '';

  // Select data
  brands: any[] = [];
  categories: any[] = [];
  sizes: any[] = [];
  colors: any[] = [];

  // ─── Variants Matrix ─────────────────────────────────────────
  selectedColorIds: Set<number> = new Set();
  selectedSizeIds: Set<number> = new Set();
  variantMatrix: VariantMatrixRow[] = [];

  // Variants — local editing (saved on "GUARDAR CAMBIOS")
  variants: any[] = [];
  editingVariantIndex: number | null = null;
  showAddVariantForm = false;
  newVariant = {
    sizeId: null,
    colorId: null,
    sku: '',
    price: null,
    compareAtPrice: null,
    stock: null,
  };

  // Images
  images: any[] = [];
  dragOver = false;

  // Tags
  tags: string[] = [];
  tagInputValue = '';

  // Searchable dropdowns
  brandSearch = '';
  categorySearch = '';
  showBrandDropdown = false;
  showCategoryDropdown = false;

  // Slug lock — disabled by default
  slugLocked = true;
  slugManuallyEdited = false;

  // ─── Quick Create Modal ──────────────────────────────────────
  showQuickModal = false;
  quickModalType: QuickCreateType = 'brand';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      slug: [{ value: '', disabled: true }],
      description: [''],
      shortDescription: [''],
      sku: [''],
      brandId: [null, Validators.required],
      categoryId: [null, Validators.required],
      featured: [false],
      isActive: [true],
    });

    // Load reference data
    this.productService.getBrands().subscribe((bs) => {
      this.brands = bs || [];
      this.cdr.detectChanges();
    });
    this.productService.getCategories().subscribe((cs) => {
      this.categories = cs || [];
      this.cdr.detectChanges();
    });
    this.loadSizesAndColors();

    this.route.params.subscribe((p) => {
      const id = p['id'];
      if (id === 'new') {
        this.isNew = true;
        this.setupAutoSlug();
      } else if (id) {
        this.productId = +id;
        this.loadProduct(this.productId);
      }
    });
  }

  loadSizesAndColors() {
    this.http.get(`${API_URL}/sizes`).subscribe({
      next: (res: any) => {
        this.sizes = Array.isArray(res) ? res : res?.content || [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
    this.http.get(`${API_URL}/colors`).subscribe({
      next: (res: any) => {
        this.colors = Array.isArray(res) ? res : res?.content || [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadProduct(id: number) {
    this.loading = true;
    this.cdr.detectChanges();
    this.productService.getProductById(id).subscribe(
      (prod) => {
        this.productName = prod.name || '';
        const matchedBrand = this.brands.find((b) => b.name === prod.brandName);
        const matchedCategory = this.categories.find((c) => c.name === prod.categoryName);
        this.form.patchValue({
          name: prod.name || '',
          slug: prod.slug || '',
          description: prod.description || '',
          shortDescription: prod.shortDescription || '',
          sku: prod.sku || '',
          brandId: matchedBrand?.id ?? null,
          categoryId: matchedCategory?.id ?? null,
          featured: prod.featured ?? false,
          isActive: prod.isActive ?? true,
        });
        if (matchedBrand) this.brandSearch = matchedBrand.name;
        if (matchedCategory) this.categorySearch = matchedCategory.name;
        this.loading = false;
        this.cdr.detectChanges();
        this.setupAutoSlug();
        this.loadVariants(id);
        this.loadImages(id);
        this.loadTags(id);
      },
      () => {
        this.loading = false;
        this.cdr.detectChanges();
        alert('Error al cargar el producto');
      },
    );
  }

  loadVariants(id: number) {
    this.productService.getProductVariants(id).subscribe({
      next: (variants) => {
        this.variants = variants || [];
        // Rebuild selected IDs from loaded variants
        this.rebuildMatrixFromVariants();
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // ─── Variant Matrix ──────────────────────────────────────────

  rebuildMatrixFromVariants() {
    this.selectedColorIds.clear();
    this.selectedSizeIds.clear();
    this.variantMatrix = [];

    for (const v of this.variants) {
      if (v.colorName) {
        const color = this.colors.find((c) => c.name === v.colorName);
        if (color) this.selectedColorIds.add(color.id);
      }
      if (v.sizeName) {
        const size = this.sizes.find((s) => s.name === v.sizeName);
        if (size) this.selectedSizeIds.add(size.id);
      }
    }
    this.calculateVariantMatrix();
  }

  toggleColorInMatrix(colorId: number) {
    if (this.selectedColorIds.has(colorId)) {
      this.selectedColorIds.delete(colorId);
    } else {
      this.selectedColorIds.add(colorId);
    }
    this.calculateVariantMatrix();
  }

  toggleSizeInMatrix(sizeId: number) {
    if (this.selectedSizeIds.has(sizeId)) {
      this.selectedSizeIds.delete(sizeId);
    } else {
      this.selectedSizeIds.add(sizeId);
    }
    this.calculateVariantMatrix();
  }

  calculateVariantMatrix() {
    const colorIds = Array.from(this.selectedColorIds);
    const sizeIds = Array.from(this.selectedSizeIds);

    // If neither selected, just one default variant
    if (colorIds.length === 0 && sizeIds.length === 0) {
      this.variantMatrix = [
        {
          colorId: null,
          sizeId: null,
          colorName: null,
          sizeName: null,
          colorHex: null,
          sku: '',
          price: null,
          compareAtPrice: null,
          stock: null,
        },
      ];
      return;
    }

    // If only colors selected (no sizes)
    if (sizeIds.length === 0) {
      this.variantMatrix = colorIds.map((cid) => {
        const color = this.colors.find((c) => c.id === cid);
        return {
          colorId: cid,
          sizeId: null,
          colorName: color?.name || null,
          sizeName: null,
          colorHex: color?.hexCode || null,
          sku: '',
          price: null,
          compareAtPrice: null,
          stock: null,
        };
      });
      return;
    }

    // If only sizes selected (no colors)
    if (colorIds.length === 0) {
      this.variantMatrix = sizeIds.map((sid) => {
        const size = this.sizes.find((s) => s.id === sid);
        return {
          colorId: null,
          sizeId: sid,
          colorName: null,
          sizeName: size?.name || null,
          colorHex: null,
          sku: '',
          price: null,
          compareAtPrice: null,
          stock: null,
        };
      });
      return;
    }

    // Cartesian product: colors × sizes
    const matrix: VariantMatrixRow[] = [];
    for (const cid of colorIds) {
      const color = this.colors.find((c) => c.id === cid);
      for (const sid of sizeIds) {
        const size = this.sizes.find((s) => s.id === sid);
        matrix.push({
          colorId: cid,
          sizeId: sid,
          colorName: color?.name || null,
          sizeName: size?.name || null,
          colorHex: color?.hexCode || null,
          sku: '',
          price: null,
          compareAtPrice: null,
          stock: null,
        });
      }
    }
    this.variantMatrix = matrix;
  }

  generateVariantsFromMatrix() {
    // Replace variants with matrix rows
    this.variants = this.variantMatrix.map((row) => ({
      id: null,
      sku: row.sku,
      sizeId: row.sizeId,
      colorId: row.colorId,
      sizeName: row.sizeName,
      colorName: row.colorName,
      colorHex: row.colorHex,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      stock: row.stock,
      isActive: true,
      _isNew: true,
    }));
  }

  // ─── Quick Create Modal ──────────────────────────────────────

  openQuickCreate(type: QuickCreateType) {
    this.quickModalType = type;
    this.showQuickModal = true;
  }

  onQuickCreated(result: BrandDTO | CategoryDTO | ColorDTO | SizeDTO) {
    this.showQuickModal = false;

    // Reload the relevant data and select the newly created item
    if (this.quickModalType === 'brand') {
      this.productService.getBrands().subscribe((bs) => {
        this.brands = bs || [];
        this.form.patchValue({ brandId: result.id });
        this.brandSearch = (result as BrandDTO).name;
        this.cdr.detectChanges();
      });
    } else if (this.quickModalType === 'category') {
      this.productService.getCategories().subscribe((cs) => {
        this.categories = cs || [];
        this.form.patchValue({ categoryId: result.id });
        this.categorySearch = (result as CategoryDTO).name;
        this.cdr.detectChanges();
      });
    } else if (this.quickModalType === 'color') {
      this.http.get(`${API_URL}/colors`).subscribe((res: any) => {
        this.colors = Array.isArray(res) ? res : res?.content || [];
        this.toggleColorInMatrix(result.id);
        this.cdr.detectChanges();
      });
    } else if (this.quickModalType === 'size') {
      this.http.get(`${API_URL}/sizes`).subscribe((res: any) => {
        this.sizes = Array.isArray(res) ? res : res?.content || [];
        this.toggleSizeInMatrix(result.id);
        this.cdr.detectChanges();
      });
    }
  }

  onQuickCancelled() {
    this.showQuickModal = false;
  }

  loadImages(id: number) {
    this.productService.getProductImages(id).subscribe({
      next: (imgs) => {
        this.images = imgs || [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadTags(id: number) {
    this.http.get(`${API_URL}/products/${id}/tags`).subscribe({
      next: (res: any) => {
        this.tags = Array.isArray(res) ? res.map((t: any) => t.name || t) : [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  // ─── Auto Slug ─────────────────────────────────────────────

  setupAutoSlug() {
    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.slugManuallyEdited && this.slugLocked) {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9áéíóúñü\s-]/g, '')
          .replace(/[\s]+/g, '-')
          .replace(/á/g, 'a')
          .replace(/é/g, 'e')
          .replace(/í/g, 'i')
          .replace(/ó/g, 'o')
          .replace(/ú/g, 'u')
          .replace(/ñ/g, 'n')
          .replace(/ü/g, 'u')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        this.form.patchValue({ slug }, { emitEvent: false });
      }
    });
  }

  onSlugInput() {
    this.slugManuallyEdited = true;
  }

  toggleSlugLock() {
    this.slugLocked = !this.slugLocked;
    const slugControl = this.form.get('slug');
    if (this.slugLocked) {
      slugControl?.disable();
      this.slugManuallyEdited = false;
    } else {
      slugControl?.enable();
      this.slugManuallyEdited = true;
    }
  }

  // ─── Searchable Dropdowns ──────────────────────────────────

  get filteredBrands() {
    if (!this.brandSearch.trim()) return this.brands;
    const q = this.brandSearch.toLowerCase();
    return this.brands.filter((b) => b.name?.toLowerCase().includes(q));
  }

  get filteredCategories() {
    if (!this.categorySearch.trim()) return this.categories;
    const q = this.categorySearch.toLowerCase();
    return this.categories.filter((c) => c.name?.toLowerCase().includes(q));
  }

  selectBrand(brand: any) {
    this.form.patchValue({ brandId: brand.id });
    this.brandSearch = brand.name;
    this.showBrandDropdown = false;
  }

  selectCategory(cat: any) {
    this.form.patchValue({ categoryId: cat.id });
    this.categorySearch = cat.name;
    this.showCategoryDropdown = false;
  }

  onBrandFocus() {
    this.showBrandDropdown = true;
    if (!this.brandSearch) {
      const selected = this.brands.find((b) => b.id === this.form.value.brandId);
      this.brandSearch = selected?.name || '';
    }
  }

  onCategoryFocus() {
    this.showCategoryDropdown = true;
    if (!this.categorySearch) {
      const selected = this.categories.find((c) => c.id === this.form.value.categoryId);
      this.categorySearch = selected?.name || '';
    }
  }

  hideBrandDropdown() {
    setTimeout(() => (this.showBrandDropdown = false), 200);
  }

  hideCategoryDropdown() {
    setTimeout(() => (this.showCategoryDropdown = false), 200);
  }

  clearBrand() {
    this.form.patchValue({ brandId: null });
    this.brandSearch = '';
    this.showBrandDropdown = false;
  }

  clearCategory() {
    this.form.patchValue({ categoryId: null });
    this.categorySearch = '';
    this.showCategoryDropdown = false;
  }

  // ─── Variants (Legacy) ─────────────────────────────────────

  get hasVariants(): boolean {
    return this.variants.length > 0;
  }

  startEditVariant(index: number) {
    this.editingVariantIndex = index;
  }

  cancelEditVariant() {
    this.editingVariantIndex = null;
  }

  saveVariantLocally(index: number) {
    this.editingVariantIndex = null;
  }

  getVariantLabel(v: any): string {
    const parts: string[] = [];
    if (v.sizeName) parts.push(v.sizeName);
    if (v.colorName) parts.push(v.colorName);
    return parts.length ? parts.join(' / ') : 'Variante única';
  }

  getColorName(colorId: number): string {
    const c = this.colors.find((col) => col.id === colorId);
    return c ? c.name : '';
  }

  getColorHex(colorId: number): string {
    const c = this.colors.find((col) => col.id === colorId);
    return c ? c.hexCode : '';
  }

  getSizeName(sizeId: number): string {
    const s = this.sizes.find((sz) => sz.id === sizeId);
    return s ? s.name : '';
  }

  openAddVariant() {
    this.showAddVariantForm = true;
    this.newVariant = {
      sizeId: null,
      colorId: null,
      sku: '',
      price: null,
      compareAtPrice: null,
      stock: null,
    };
  }

  cancelAddVariant() {
    this.showAddVariantForm = false;
  }

  confirmAddVariant() {
    const nv = this.newVariant;
    if (!nv.sizeId && !nv.colorId) return;
    this.variants.push({
      id: null,
      sku: nv.sku,
      sizeName: nv.sizeId ? this.getSizeName(nv.sizeId) : null,
      colorName: nv.colorId ? this.getColorName(nv.colorId) : null,
      colorHex: nv.colorId ? this.getColorHex(nv.colorId) : null,
      price: nv.price,
      compareAtPrice: nv.compareAtPrice,
      stock: nv.stock,
      isActive: true,
      _isNew: true,
    });
    this.showAddVariantForm = false;
  }

  // ─── Images ────────────────────────────────────────────────

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadImages(files);
    }
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.uploadImages(files);
    }
  }

  triggerFileInput() {
    this.fileInput?.nativeElement?.click();
  }

  uploadImages(files: FileList) {
    if (!this.productId) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    this.http.post(`${API_URL}/products/${this.productId}/images`, formData).subscribe({
      next: () => {
        this.loadImages(this.productId!);
      },
      error: () => alert('Error al subir imágenes'),
    });
  }

  setMainImage(imageId: number) {
    if (!this.productId) return;
    this.http.put(`${API_URL}/products/${this.productId}/images/${imageId}/main`, {}).subscribe({
      next: () => this.loadImages(this.productId!),
      error: () => {},
    });
  }

  removeImage(imageId: number) {
    if (!this.productId) return;
    this.http.delete(`${API_URL}/products/${this.productId}/images/${imageId}`).subscribe({
      next: () => this.loadImages(this.productId!),
      error: () => {},
    });
  }

  // ─── Tags ──────────────────────────────────────────────────

  onTagKeydown(event: KeyboardEvent) {
    const input = (event.target as HTMLInputElement).value;
    if (event.key === ',' || event.key === 'Enter') {
      event.preventDefault();
      this.addTagFromInput(input);
    }
  }

  onTagBlur(event: FocusEvent) {
    const input = (event.target as HTMLInputElement).value;
    if (input.trim()) {
      this.addTagFromInput(input);
    }
  }

  private addTagFromInput(input: string) {
    const parts = input
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0 && !this.tags.includes(t));
    if (parts.length > 0) {
      this.tags.push(...parts);
      this.tagInputValue = '';
      this.cdr.detectChanges();
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  // ─── Save ──────────────────────────────────────────────────

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.cdr.detectChanges();

    // First generate variants from the matrix
    this.generateVariantsFromMatrix();

    // Re-enable slug to include it in form value
    this.form.get('slug')?.enable();

    const payload = {
      ...this.form.value,
      tags: this.tags,
    };

    if (this.isNew) {
      this.productService.createProduct(payload).subscribe(
        (created: any) => {
          this.productId = created.id || created;
          this.saveVariantsAndFinish();
        },
        () => {
          this.saving = false;
          this.cdr.detectChanges();
          alert('Error creando producto');
        },
      );
    } else if (this.productId) {
      this.productService.updateProduct(this.productId, payload).subscribe(
        () => {
          const tagOps =
            this.tags.length > 0
              ? this.http.put(`${API_URL}/products/${this.productId}/tags`, this.tags)
              : this.http.delete(`${API_URL}/products/${this.productId}/tags`);

          tagOps.subscribe({
            next: () => this.saveVariantsAndFinish(),
            error: () => this.saveVariantsAndFinish(),
          });
        },
        () => {
          this.saving = false;
          this.cdr.detectChanges();
          alert('Error actualizando producto');
        },
      );
    }
  }

  private saveVariantsAndFinish() {
    if (!this.productId) {
      this.saving = false;
      this.router.navigate(['/admin/catalog/products']);
      return;
    }

    const newVariants = this.variants.filter((v) => v._isNew);
    const existingVariants = this.variants.filter((v) => !v._isNew && v.id);

    let completed = 0;
    const total = existingVariants.length + newVariants.length;

    const checkDone = () => {
      completed++;
      if (completed >= total) {
        this.saving = false;
        this.router.navigate(['/admin/catalog/products']);
      }
    };

    // Update existing variants
    existingVariants.forEach((v) => {
      this.http
        .put(`${API_URL}/products/variants/${v.id}`, {
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
        })
        .subscribe({ next: () => checkDone(), error: () => checkDone() });
    });

    // Create new variants
    newVariants.forEach((v) => {
      this.http
        .post(`${API_URL}/products/${this.productId}/variants`, {
          sizeId: v.sizeId,
          colorId: v.colorId,
          sku: v.sku,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stock: v.stock,
        })
        .subscribe({ next: () => checkDone(), error: () => checkDone() });
    });

    if (total === 0) {
      this.saving = false;
      this.router.navigate(['/admin/catalog/products']);
    }
  }
}

export interface VariantMatrixRow {
  colorId: number | null;
  sizeId: number | null;
  colorName: string | null;
  sizeName: string | null;
  colorHex: string | null;
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  stock: number | null;
}

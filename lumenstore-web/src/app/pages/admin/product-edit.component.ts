import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CloudinaryUrlPipe } from '../../pipes/cloudinary-url.pipe';
import { ProductService } from '../../services/product.service';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../services/api.service';
import { QuickCreateModalComponent, QuickCreateType } from './quick-create-modal.component';
import { BrandDTO, CategoryDTO, ColorDTO, SizeDTO } from '../../services/catalog-admin.service';
import { NotificationService } from '../../services/notification.service';

/* ─── Interfaces ────────────────────────────────────────── */

interface VariantMatrixRow {
  id: number | null;
  colorId: number | null;
  sizeId: number | null;
  colorName: string | null;
  sizeName: string | null;
  colorHex: string | null;
  sku: string;
  barcode: string;
  price: number | null;
  compareAtPrice: number | null;
  cost: number | null;
  stock: number | null;
  minStock: number | null;
  weight: number | null;
  isActive: boolean;
  imageUrl: string | null;
  margin: number | null;
  _isNew?: boolean;
}

interface FormSection {
  id: string;
  label: string;
  icon: string;
  isCollapsible: boolean;
  isCollapsed: boolean;
}

interface Discount {
  id: number;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

interface BulkEditValues {
  price: number | null;
  cost: number | null;
  compareAtPrice: number | null;
  stock: number | null;
  weight: number | null;
  isActive: boolean | null;
}

/* ─── Constants ─────────────────────────────────────────── */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;
const META_KEYWORDS_MAX = 500;

@Component({
  selector: 'app-admin-product-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    QuickCreateModalComponent,
    CloudinaryUrlPipe,
  ],
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.scss'],
})
export class AdminProductEditComponent implements OnInit, OnDestroy {
  /* ─── Template refs ─────────────────────────────────── */
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('variantFileInput') variantFileInput!: ElementRef;
  @ViewChild('tagInput') tagInput!: ElementRef;
  @ViewChild('contentContainer') contentContainer!: ElementRef;

  /* ─── Form core ─────────────────────────────────────── */
  form!: FormGroup;
  loading = false;
  saving = false;
  isNew = false;
  productId: number | null = null;
  productName = '';
  lastSavedAt: Date | null = null;

  /* ─── Reference data ────────────────────────────────── */
  brands: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];
  sizes: any[] = [];
  colors: any[] = [];
  tags: string[] = [];
  tagInputValue = '';

  /* ─── Sections ──────────────────────────────────────── */
  sections: FormSection[] = [
    {
      id: 'general',
      label: 'Información general',
      icon: '📋',
      isCollapsible: false,
      isCollapsed: false,
    },
    {
      id: 'organization',
      label: 'Organización',
      icon: '🏷️',
      isCollapsible: false,
      isCollapsed: false,
    },
    { id: 'variants', label: 'Variantes', icon: '🧩', isCollapsible: false, isCollapsed: false },
    {
      id: 'pricing',
      label: 'Precios e inventario',
      icon: '💰',
      isCollapsible: false,
      isCollapsed: false,
    },
    { id: 'images', label: 'Imágenes', icon: '🖼️', isCollapsible: false, isCollapsed: false },
    { id: 'discounts', label: 'Descuentos', icon: '🏷️', isCollapsible: false, isCollapsed: false },
  ];
  secondarySections: FormSection[] = [
    { id: 'seo', label: 'SEO', icon: '🔍', isCollapsible: true, isCollapsed: true },
    { id: 'attributes', label: 'Atributos', icon: '📐', isCollapsible: true, isCollapsed: true },
    { id: 'config', label: 'Configuración', icon: '⚙️', isCollapsible: true, isCollapsed: true },
    { id: 'history', label: 'Historial', icon: '📊', isCollapsible: true, isCollapsed: true },
  ];
  activeSection = 'general';

  /* ─── Searchable dropdowns ──────────────────────────── */
  brandSearch = '';
  categorySearch = '';
  showBrandDropdown = false;
  showCategoryDropdown = false;

  /* ─── Slug ──────────────────────────────────────────── */
  slugLocked = true;
  slugManuallyEdited = false;

  /* ─── Variants ──────────────────────────────────────── */
  selectedColorIds: Set<number> = new Set();
  selectedSizeIds: Set<number> = new Set();
  variantMatrix: VariantMatrixRow[] = [];
  variants: any[] = [];
  showBulkEdit = false;
  bulkEditValues: BulkEditValues = {
    price: null,
    cost: null,
    compareAtPrice: null,
    stock: null,
    weight: null,
    isActive: null,
  };
  editingVariantIndex: number | null = null;

  /* ─── Quick Create ──────────────────────────────────── */
  showQuickModal = false;
  quickModalType: QuickCreateType = 'brand';

  /* ─── Images ────────────────────────────────────────── */
  images: any[] = [];
  dragOver = false;
  pendingFiles: File[] = [];
  pendingPreviews: { file: File; url: string }[] = [];
  uploadProgress = 0;
  isUploading = false;
  selectedImageForVariant: { image: any; variantIndex: number } | null = null;
  showDeleteImageModal = false;
  deleteImageTargetId: number | null = null;
  deletingImage = false;
  dragImageIndex: number | null = null;
  dragOverImageIndex: number | null = null;

  /* ─── Discounts ─────────────────────────────────────── */
  availableDiscounts: Discount[] = [];
  selectedDiscountIds: Set<number> = new Set();

  /* ─── Price history ─────────────────────────────────── */
  priceHistory: any[] = [];

  /* ─── SEO Preview ───────────────────────────────────── */
  seoPreviewUrl = '';
  seoPreviewTitle = '';
  seoPreviewDesc = '';

  /* ─── Validation state ──────────────────────────────── */
  validationErrors: { field: string; message: string }[] = [];
  slugChecking = false;
  skuChecking = false;

  /* ─── Character limits ──────────────────────────────── */
  readonly SEO_TITLE_MAX = SEO_TITLE_MAX;
  readonly SEO_DESC_MAX = SEO_DESC_MAX;
  readonly META_KEYWORDS_MAX = META_KEYWORDS_MAX;

  /* ─── Computed ──────────────────────────────────────── */
  get minPrice(): number | null {
    const prices = this.variantMatrix
      .map((r) => r.price)
      .filter((p): p is number => p !== null && p > 0);
    return prices.length > 0 ? Math.min(...prices) : null;
  }

  get maxPrice(): number | null {
    const prices = this.variantMatrix
      .map((r) => r.price)
      .filter((p): p is number => p !== null && p > 0);
    return prices.length > 0 ? Math.max(...prices) : null;
  }

  get totalStock(): number {
    return this.variantMatrix.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);
  }

  get totalVariants(): number {
    return this.variantMatrix.length;
  }

  get activeVariants(): number {
    return this.variantMatrix.filter((r) => r.isActive).length;
  }

  get hasMainImage(): boolean {
    return this.images.some((i) => i.isMain);
  }

  get nameLength(): number {
    return (this.form?.get('name')?.value || '').length;
  }

  get descriptionLength(): number {
    return (this.form?.get('description')?.value || '').length;
  }

  get seoTitleLength(): number {
    return (this.form?.get('metaTitle')?.value || '').length;
  }

  get seoDescLength(): number {
    return (this.form?.get('metaDescription')?.value || '').length;
  }

  get keywordsLength(): number {
    return (this.form?.get('metaKeywords')?.value || '').length;
  }

  /* ─── Constructor ───────────────────────────────────── */
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notify: NotificationService,
  ) {}

  /* ─── Lifecycle ─────────────────────────────────────── */
  ngOnInit() {
    this.buildForm();
    this.loadReferenceData();

    this.route.params.subscribe((p) => {
      const id = p['id'];
      if (id) {
        this.productId = +id;
        this.loadProduct(this.productId);
      } else {
        this.isNew = true;
        this.setupAutoSlug();
      }
    });

    // Watch SEO fields for preview
    this.form.get('slug')?.valueChanges.subscribe(() => this.updateSeoPreview());
    this.form.get('metaTitle')?.valueChanges.subscribe(() => this.updateSeoPreview());
    this.form.get('metaDescription')?.valueChanges.subscribe(() => this.updateSeoPreview());

    // Load subcategories when category changes
    this.form.get('categoryId')?.valueChanges.subscribe((catId) => {
      this.loadSubcategories(catId);
    });
  }

  ngOnDestroy(): void {
    this.pendingPreviews.forEach((p) => URL.revokeObjectURL(p.url));
  }

  /* ─── Form Building ─────────────────────────────────── */
  private buildForm() {
    this.form = this.fb.group(
      {
        name: ['', [Validators.required, Validators.maxLength(255)]],
        slug: [{ value: '', disabled: true }, Validators.required],
        description: ['', Validators.maxLength(5000)],
        shortDescription: ['', Validators.maxLength(500)],
        sku: ['', Validators.maxLength(50)],
        brandId: [null, Validators.required],
        categoryId: [null, Validators.required],
        featured: [false],
        isActive: [true],
        metaTitle: ['', Validators.maxLength(SEO_TITLE_MAX)],
        metaDescription: ['', Validators.maxLength(SEO_DESC_MAX)],
        metaKeywords: ['', Validators.maxLength(META_KEYWORDS_MAX)],
        material: ['', Validators.maxLength(255)],
        weight: [null],
        dimensions: ['', Validators.maxLength(100)],
        gender: [''],
        warranty: ['', Validators.maxLength(255)],
        manufacturer: ['', Validators.maxLength(255)],
        countryOfOrigin: ['', Validators.maxLength(100)],
        freeShipping: [false],
        isNew: [false],
        visibility: ['visible'],
      },
      { validators: this.productValidators },
    );

    // Real-time slug check
    this.form.get('slug')?.valueChanges.subscribe((slug) => {
      if (slug && slug.length >= 3) {
        this.checkSlugExists(slug);
      }
    });

    // Real-time SKU check
    this.form.get('sku')?.valueChanges.subscribe((sku) => {
      if (sku && sku.length >= 2) {
        this.checkSkuExists(sku);
      }
    });
  }

  private productValidators(control: AbstractControl): ValidationErrors | null {
    const form = control as FormGroup;
    const name = form.get('name')?.value;
    const brandId = form.get('brandId')?.value;
    const categoryId = form.get('categoryId')?.value;
    if (!name || !brandId || !categoryId) {
      return { requiredFields: true };
    }
    return null;
  }

  /* ─── Data Loading ──────────────────────────────────── */
  private loadReferenceData() {
    this.loading = true;
    this.productService.getBrands().subscribe((bs) => {
      this.brands = bs || [];
      this.cdr.detectChanges();
    });
    this.productService.getCategories().subscribe((cs) => {
      this.categories = cs || [];
      this.cdr.detectChanges();
    });
    this.loadSizesAndColors();
    this.loadAvailableDiscounts();
    this.loading = false;
  }

  loadSubcategories(categoryId: number | null) {
    if (!categoryId) {
      this.subcategories = [];
      return;
    }
    this.productService.getSubCategories(categoryId).subscribe({
      next: (subs) => {
        this.subcategories = subs || [];
        this.cdr.detectChanges();
      },
      error: () => {},
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

  loadAvailableDiscounts() {
    this.http.get(`${API_URL}/discounts`).subscribe({
      next: (res: any) => {
        this.availableDiscounts = Array.isArray(res) ? res : res?.content || [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadProduct(id: number) {
    this.loading = true;
    this.cdr.detectChanges();
    this.productService.getProductById(id).subscribe(
      (prod: any) => {
        this.productName = prod.name || '';
        this.form.patchValue({
          name: prod.name || '',
          slug: prod.slug || '',
          description: prod.description || '',
          shortDescription: prod.shortDescription || '',
          sku: prod.sku || '',
          brandId: prod.brandId ?? null,
          categoryId: prod.categoryId ?? null,
          featured: prod.featured ?? false,
          isActive: prod.isActive ?? true,
          metaTitle: prod.metaTitle || '',
          metaDescription: prod.metaDescription || '',
          metaKeywords: prod.metaKeywords || '',
          material: prod.material || '',
          weight: prod.weight || null,
          dimensions: prod.dimensions || '',
          gender: prod.gender || '',
          warranty: prod.warranty || '',
          manufacturer: prod.manufacturer || '',
          countryOfOrigin: prod.countryOfOrigin || '',
          freeShipping: prod.freeShipping ?? false,
          isNew: prod.isNew ?? false,
          visibility: prod.visibility || 'visible',
        });
        if (prod.brandName) this.brandSearch = prod.brandName;
        if (prod.categoryName) this.categorySearch = prod.categoryName;
        this.updateSeoPreview();
        this.loading = false;
        this.cdr.detectChanges();
        this.setupAutoSlug();
        this.loadVariants(id);
        this.loadImages(id);
        this.loadTags(id);
        this.loadDiscountsForProduct(id);
        this.loadPriceHistory(id);
      },
      () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.notify.error('No se pudo cargar el producto.', 'Error al cargar');
        this.router.navigate(['/admin/catalog/products']);
      },
    );
  }

  loadVariants(id: number) {
    this.productService.getProductVariants(id).subscribe({
      next: (variants: any) => {
        this.variants = variants || [];
        this.rebuildMatrixFromVariants();
        this.cdr.detectChanges();
      },
      error: () => {},
    });
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
        this.tags = Array.isArray(res) ? res : [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadDiscountsForProduct(id: number) {
    this.http.get(`${API_URL}/products/${id}/discounts`).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : [];
        this.selectedDiscountIds = new Set(list.map((d: any) => d.id));
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  loadPriceHistory(id: number) {
    this.http.get(`${API_URL}/products/${id}/price-history`).subscribe({
      next: (res: any) => {
        this.priceHistory = Array.isArray(res) ? res : [];
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  /* ─── Navigation ────────────────────────────────────── */
  scrollToSection(sectionId: string) {
    this.activeSection = sectionId;
    const el = document.getElementById(`section-${sectionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  @HostListener('window:scroll')
  onScroll() {
    const offset = 140;
    for (const section of [...this.sections, ...this.secondarySections]) {
      const el = document.getElementById(`section-${section.id}`);
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom >= offset) {
          if (this.activeSection !== section.id) {
            this.activeSection = section.id;
            this.cdr.detectChanges();
          }
          break;
        }
      }
    }
  }

  @HostListener('window:keydown.control.s', ['$event'])
  @HostListener('window:keydown.meta.s', ['$event'])
  onSaveKey(event: Event) {
    event.preventDefault();
    if (!this.saving) {
      this.save();
    }
  }

  toggleCollapse(section: FormSection) {
    section.isCollapsed = !section.isCollapsed;
  }

  /* ─── Slug ──────────────────────────────────────────── */
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
        this.updateSeoPreview();
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

  private checkSlugExists(slug: string) {
    this.slugChecking = true;
    const url = this.isNew
      ? `${API_URL}/products/slug-exists?slug=${slug}`
      : `${API_URL}/products/slug-exists?slug=${slug}&excludeId=${this.productId}`;
    this.http.get(url).subscribe({
      next: (res: any) => {
        this.slugChecking = false;
        if (res.exists) {
          this.form.get('slug')?.setErrors({ slugTaken: true });
        } else {
          const errors = this.form.get('slug')?.errors;
          if (errors) {
            delete errors['slugTaken'];
            this.form.get('slug')?.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
        this.cdr.detectChanges();
      },
      error: () => (this.slugChecking = false),
    });
  }

  private checkSkuExists(sku: string) {
    this.skuChecking = true;
    const url = this.isNew
      ? `${API_URL}/products/sku-exists?sku=${sku}`
      : `${API_URL}/products/sku-exists?sku=${sku}&excludeId=${this.productId}`;
    this.http.get(url).subscribe({
      next: (res: any) => {
        this.skuChecking = false;
        if (res.exists) {
          this.form.get('sku')?.setErrors({ skuTaken: true });
        } else {
          const errors = this.form.get('sku')?.errors;
          if (errors) {
            delete errors['skuTaken'];
            this.form.get('sku')?.setErrors(Object.keys(errors).length ? errors : null);
          }
        }
        this.cdr.detectChanges();
      },
      error: () => (this.skuChecking = false),
    });
  }

  /* ─── Searchable Dropdowns ──────────────────────────── */
  delayedClose(field: 'brand' | 'category') {
    setTimeout(() => {
      if (field === 'brand') this.showBrandDropdown = false;
      else this.showCategoryDropdown = false;
    }, 200);
  }

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

  /* ─── Variants ──────────────────────────────────────── */
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
    this.fillMatrixFromVariants();
  }

  private fillMatrixFromVariants() {
    for (const row of this.variantMatrix) {
      const match = this.variants.find(
        (v: any) =>
          (v.sizeId === row.sizeId || (!v.sizeId && !row.sizeId)) &&
          (v.colorId === row.colorId || (!v.colorId && !row.colorId)),
      );
      if (match) {
        row.id = match.id;
        row.sku = match.sku || '';
        row.barcode = match.barcode || '';
        row.price = match.price;
        row.compareAtPrice = match.compareAtPrice;
        row.stock = match.stock;
        row.isActive = match.isActive !== false;
        row.cost = match.cost;
        row.minStock = match.minStock;
        row.weight = match.weight;
        row.imageUrl = match.imageUrl;
        row.margin = this.calcMargin(row.price, row.cost);
      }
    }
  }

  calcMargin(price: number | null, cost: number | null): number | null {
    if (price && cost && price > 0) {
      return ((price - cost) / price) * 100;
    }
    return null;
  }

  toggleColor(colorId: number) {
    if (this.selectedColorIds.has(colorId)) {
      this.selectedColorIds.delete(colorId);
    } else {
      this.selectedColorIds.add(colorId);
    }
    this.calculateVariantMatrix();
  }

  toggleSize(sizeId: number) {
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

    const buildRow = (cid: number | null, sid: number | null): VariantMatrixRow => {
      const color = cid ? this.colors.find((c) => c.id === cid) : null;
      const size = sid ? this.sizes.find((s) => s.id === sid) : null;
      const existing = this.variants.find(
        (v: any) =>
          (v.sizeId === sid || (!v.sizeId && !sid)) && (v.colorId === cid || (!v.colorId && !cid)),
      );
      return {
        id: existing?.id || null,
        colorId: cid,
        sizeId: sid,
        colorName: color?.name || null,
        sizeName: size?.name || null,
        colorHex: color?.hexCode || null,
        sku: existing?.sku || '',
        barcode: existing?.barcode || '',
        price: existing?.price ?? null,
        compareAtPrice: existing?.compareAtPrice ?? null,
        cost: existing?.cost ?? null,
        stock: existing?.stock ?? null,
        minStock: existing?.minStock ?? 0,
        weight: existing?.weight ?? null,
        isActive: existing?.isActive !== false,
        imageUrl: existing?.imageUrl || null,
        margin: existing ? this.calcMargin(existing.price, existing.cost) : null,
      };
    };

    if (colorIds.length === 0 && sizeIds.length === 0) {
      this.variantMatrix = [buildRow(null, null)];
      return;
    }
    if (sizeIds.length === 0) {
      this.variantMatrix = colorIds.map((cid) => buildRow(cid, null));
      return;
    }
    if (colorIds.length === 0) {
      this.variantMatrix = sizeIds.map((sid) => buildRow(null, sid));
      return;
    }

    const matrix: VariantMatrixRow[] = [];
    for (const cid of colorIds) {
      for (const sid of sizeIds) {
        matrix.push(buildRow(cid, sid));
      }
    }
    this.variantMatrix = matrix;
  }

  recalcRowMargin(row: VariantMatrixRow) {
    row.margin = this.calcMargin(row.price, row.cost);
  }

  toggleVariantActive(index: number) {
    if (this.variantMatrix[index]) {
      this.variantMatrix[index].isActive = !this.variantMatrix[index].isActive;
    }
  }

  /* ─── Bulk Edit ─────────────────────────────────────── */
  toggleBulkEdit() {
    this.showBulkEdit = !this.showBulkEdit;
    if (!this.showBulkEdit) {
      this.bulkEditValues = {
        price: null,
        cost: null,
        compareAtPrice: null,
        stock: null,
        weight: null,
        isActive: null,
      };
    }
  }

  applyBulkEdit() {
    const b = this.bulkEditValues;
    for (const row of this.variantMatrix) {
      if (b.price !== null) row.price = b.price;
      if (b.cost !== null) row.cost = b.cost;
      if (b.compareAtPrice !== null) row.compareAtPrice = b.compareAtPrice;
      if (b.stock !== null) row.stock = b.stock;
      if (b.weight !== null) row.weight = b.weight;
      if (b.isActive !== null) row.isActive = b.isActive;
      row.margin = this.calcMargin(row.price, row.cost);
    }
    this.notify.success(
      `Valores aplicados a ${this.variantMatrix.length} variante(s).`,
      'Edición masiva',
    );
    this.showBulkEdit = false;
  }

  /* ─── Quick Create ──────────────────────────────────── */
  openQuickCreate(type: QuickCreateType) {
    this.quickModalType = type;
    this.showQuickModal = true;
  }

  onQuickCreated(result: BrandDTO | CategoryDTO | ColorDTO | SizeDTO) {
    this.showQuickModal = false;
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
        this.toggleColor(result.id);
        this.cdr.detectChanges();
      });
    } else if (this.quickModalType === 'size') {
      this.http.get(`${API_URL}/sizes`).subscribe((res: any) => {
        this.sizes = Array.isArray(res) ? res : res?.content || [];
        this.toggleSize(result.id);
        this.cdr.detectChanges();
      });
    }
  }

  onQuickCancelled() {
    this.showQuickModal = false;
  }

  /* ─── Tags ──────────────────────────────────────────── */
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
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !this.tags.includes(t));
    if (parts.length > 0) {
      this.tags.push(...parts);
      this.tagInputValue = '';
      this.cdr.detectChanges();
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  /* ─── Images ────────────────────────────────────────── */
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
    // Reset input so same file can be re-selected
    if (event.target) {
      event.target.value = '';
    }
  }

  triggerFileInput() {
    this.fileInput?.nativeElement?.click();
  }

  private validateImageFiles(files: File[]): File[] {
    const valid: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": formato no permitido (usa JPG, PNG, WEBP, GIF o AVIF).`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errors.push(`"${file.name}": supera el tamaño máximo de 10 MB.`);
        continue;
      }
      // Check for duplicates by name+size (not URL which is always unique)
      const isDuplicate = this.images.some(
        (img) => img.originalName === file.name && img.fileSize === file.size,
      );
      if (isDuplicate) {
        errors.push(`"${file.name}": imagen duplicada.`);
        continue;
      }
      valid.push(file);
    }

    if (errors.length > 0) {
      this.notify.warning(errors.join(' '), 'Algunas imágenes no se pudieron agregar');
    }
    return valid;
  }

  uploadImages(files: FileList) {
    const validFiles = this.validateImageFiles(Array.from(files));
    if (validFiles.length === 0) return;

    if (!this.productId) {
      // New product — add to pending with preview
      for (const file of validFiles) {
        this.pendingFiles.push(file);
        this.pendingPreviews.push({ file, url: URL.createObjectURL(file) });
      }
      return;
    }
    // Existing product — upload immediately
    this.sendImages(validFiles);
  }

  uploadPendingImagesNow() {
    if (!this.productId) {
      // Try to auto-create a product first, then upload
      this.saveAndUploadPending();
      return;
    }
    this.uploadPendingImages();
  }

  private saveAndUploadPending() {
    const payload = this.isNew ? { ...this.form.value, tags: this.tags, isActive: false } : null;
    if (!payload) return;

    this.saving = true;
    this.form.get('slug')?.enable();
    this.productService.createProduct(payload).subscribe(
      (created: any) => {
        this.productId = created.id || created;
        this.isNew = false;
        this.uploadPendingImages();
      },
      (err) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.notify.apiError(err, 'No se pudo crear el producto provisional.', 'Error');
      },
    );
  }

  removePendingImage(index: number) {
    const preview = this.pendingPreviews[index];
    if (preview) URL.revokeObjectURL(preview.url);
    this.pendingPreviews.splice(index, 1);
    this.pendingFiles.splice(index, 1);
  }

  private uploadPendingImages() {
    if (this.pendingFiles.length === 0 || !this.productId) return;
    const files = [...this.pendingFiles];
    this.pendingFiles = [];
    this.pendingPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    this.pendingPreviews = [];
    this.sendImages(files);
  }

  private sendImages(files: File[]) {
    this.isUploading = true;
    this.uploadProgress = 0;
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }
    this.http
      .post(`${API_URL}/products/${this.productId}/images`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .subscribe({
        next: (event: any) => {
          if (event.type === 1 && event.total) {
            this.uploadProgress = Math.round((event.loaded / event.total) * 100);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isUploading = false;
          this.notify.apiError(err, 'No se pudieron subir las imágenes.', 'Error');
          this.cdr.detectChanges();
        },
        complete: () => {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.loadImages(this.productId!);
          this.cdr.detectChanges();
        },
      });
  }

  setMainImage(imageId: number) {
    if (!this.productId) return;
    this.http.put(`${API_URL}/products/${this.productId}/images/${imageId}/main`, {}).subscribe({
      next: () => this.loadImages(this.productId!),
      error: () => {},
    });
  }

  confirmDeleteImage(imageId: number) {
    this.deleteImageTargetId = imageId;
    this.showDeleteImageModal = true;
  }

  cancelDeleteImage() {
    this.showDeleteImageModal = false;
    this.deleteImageTargetId = null;
  }

  executeDeleteImage() {
    if (!this.productId || !this.deleteImageTargetId) return;
    this.deletingImage = true;
    this.http
      .delete(`${API_URL}/products/${this.productId}/images/${this.deleteImageTargetId}`)
      .subscribe({
        next: () => {
          this.showDeleteImageModal = false;
          this.deleteImageTargetId = null;
          this.deletingImage = false;
          this.loadImages(this.productId!);
          this.notify.success('Imagen eliminada.', 'Eliminada');
        },
        error: (err) => {
          this.showDeleteImageModal = false;
          this.deleteImageTargetId = null;
          this.deletingImage = false;
          this.notify.apiError(err, 'No se pudo eliminar la imagen.', 'Error');
        },
      });
  }

  /* ─── Drag & Drop reorder for images ────────────────── */
  onImageDragStart(index: number) {
    this.dragImageIndex = index;
  }

  onImageDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    this.dragOverImageIndex = index;
  }

  onImageDrop(event: DragEvent) {
    event.preventDefault();
    if (
      this.dragImageIndex !== null &&
      this.dragOverImageIndex !== null &&
      this.dragImageIndex !== this.dragOverImageIndex
    ) {
      const [moved] = this.images.splice(this.dragImageIndex, 1);
      this.images.splice(this.dragOverImageIndex, 0, moved);
    }
    this.dragImageIndex = null;
    this.dragOverImageIndex = null;
  }

  onImageDragEnd() {
    this.dragImageIndex = null;
    this.dragOverImageIndex = null;
  }

  /* ─── Assign image to variant ───────────────────────── */
  openImagePickerForVariant(variantIndex: number) {
    this.selectedImageForVariant = { image: null, variantIndex };
    this.variantFileInput?.nativeElement?.click();
  }

  onFileSelectedForVariant(event: any) {
    if (!this.selectedImageForVariant) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const variantIdx = this.selectedImageForVariant.variantIndex;
    const row = this.variantMatrix[variantIdx];
    if (!row) return;

    if (this.productId) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('files', file);
      this.http
        .post(`${API_URL}/products/${this.productId}/images?variantId=${variantIdx}`, formData)
        .subscribe({
          next: (res: any) => {
            if (res && res.length > 0) {
              row.imageUrl = res[0].imageUrl || res[0].url;
            }
            this.loadImages(this.productId!);
            this.isUploading = false;
            this.notify.success('Imagen asignada a la variante.');
            this.cdr.detectChanges();
          },
          error: () => {
            this.isUploading = false;
            this.notify.error('No se pudo asignar la imagen.', 'Error');
          },
        });
    }
    this.selectedImageForVariant = null;
  }

  /* ─── Discounts ─────────────────────────────────────── */
  toggleDiscount(discountId: number) {
    if (this.selectedDiscountIds.has(discountId)) {
      this.selectedDiscountIds.delete(discountId);
    } else {
      this.selectedDiscountIds.add(discountId);
    }
  }

  getDiscountPreview(discount: Discount): { savings: number; finalPrice: number } | null {
    const firstPrice = this.variantMatrix.find((r) => r.price && r.price > 0)?.price;
    if (!firstPrice) return null;
    if (discount.discountType === 'percentage') {
      const savings = (firstPrice * discount.value) / 100;
      return { savings, finalPrice: firstPrice - savings };
    }
    return { savings: discount.value, finalPrice: firstPrice - discount.value };
  }

  get totalSavings(): number {
    let total = 0;
    for (const id of this.selectedDiscountIds) {
      const d = this.availableDiscounts.find((disc) => disc.id === id);
      if (d) {
        const preview = this.getDiscountPreview(d);
        if (preview) total += preview.savings;
      }
    }
    return total;
  }

  /* ─── SEO Preview ───────────────────────────────────── */
  private updateSeoPreview() {
    const slug = this.form?.get('slug')?.value || 'producto';
    this.seoPreviewUrl = `https://lumenstore.pe/producto/${slug}`;
    this.seoPreviewTitle =
      this.form?.get('metaTitle')?.value || this.form?.get('name')?.value || 'Título del producto';
    this.seoPreviewDesc =
      this.form?.get('metaDescription')?.value || this.form?.get('shortDescription')?.value || '';
  }

  /* ─── Save Discounts ────────────────────────────────── */
  saveDiscounts(productId: number) {
    const discountIds = Array.from(this.selectedDiscountIds);
    if (discountIds.length === 0) return;
    this.http.put(`${API_URL}/products/${productId}/discounts`, discountIds).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  /* ─── Save ──────────────────────────────────────────── */
  private originalVariants: any[] = [];

  generateVariantsFromMatrix() {
    this.variants = this.variantMatrix.map((row) => ({
      id: row.id,
      sku: row.sku,
      barcode: row.barcode,
      sizeId: row.sizeId,
      colorId: row.colorId,
      sizeName: row.sizeName,
      colorName: row.colorName,
      colorHex: row.colorHex,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      stock: row.stock,
      isActive: row.isActive,
      cost: row.cost,
      minStock: row.minStock,
      weight: row.weight,
      imageUrl: row.imageUrl,
      _isNew: !row.id,
    }));
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revisa los campos obligatorios.', 'Formulario incompleto');
      this.scrollToSection('general');
      return;
    }

    // Validate business rules
    if (!this.hasMainImage) {
      this.notify.warning(
        'El producto debe tener al menos una imagen principal.',
        'Imagen requerida',
      );
      this.scrollToSection('images');
      return;
    }

    if (!this.variantMatrix.some((r) => r.isActive && Number(r.price) > 0)) {
      this.notify.warning(
        'Debe haber al menos una variante activa con precio.',
        'Variante requerida',
      );
      this.scrollToSection('variants');
      return;
    }

    // Check price vs cost
    const badMargins = this.variantMatrix.filter(
      (r) => r.isActive && r.price && r.cost && r.price < r.cost,
    );
    if (badMargins.length > 0) {
      this.notify.warning(
        `${badMargins.length} variante(s) tienen precio menor al costo. Revisa los márgenes.`,
        'Precio inválido',
      );
      return;
    }

    this.originalVariants = this.variants.map((v) => ({ ...v }));
    this.generateVariantsFromMatrix();
    this.saving = true;
    this.cdr.detectChanges();

    this.form.get('slug')?.enable();
    const payload = { ...this.form.value, tags: this.tags };

    if (this.isNew) {
      this.productService.createProduct(payload).subscribe(
        (created: any) => {
          this.productId = created.id || created;
          this.http.get<any[]>(`${API_URL}/products/${this.productId}/variants`).subscribe({
            next: (serverVariants) => {
              this.originalVariants = serverVariants;
              this.uploadPendingImages();
              this.saveDiscounts(this.productId!);
              this.saveTagsAndVariants(true);
            },
            error: () => {
              this.originalVariants = [];
              this.uploadPendingImages();
              this.saveDiscounts(this.productId!);
              this.saveTagsAndVariants(true);
            },
          });
        },
        (err) => {
          this.saving = false;
          this.cdr.detectChanges();
          this.notify.apiError(err, 'No se pudo crear el producto.', 'Error');
        },
      );
    } else if (this.productId) {
      this.productService.updateProduct(this.productId, payload).subscribe(
        () => {
          this.saveDiscounts(this.productId!);
          this.uploadPendingImages();
          this.saveTagsAndVariants(false);
        },
        (err) => {
          this.saving = false;
          this.cdr.detectChanges();
          this.notify.apiError(err, 'No se pudo actualizar.', 'Error');
        },
      );
    } else {
      this.saving = false;
      this.cdr.detectChanges();
      this.notify.error('Error inesperado. Recarga la página.', 'Error');
    }
  }

  private saveTagsAndVariants(isCreate: boolean) {
    if (!this.productId) {
      this.finishSave(isCreate);
      return;
    }

    const tagOps =
      this.tags.length > 0
        ? this.http.put(`${API_URL}/products/${this.productId}/tags`, this.tags)
        : this.http.delete(`${API_URL}/products/${this.productId}/tags`);

    tagOps.subscribe({
      next: () => this.saveVariants(isCreate),
      error: () => this.saveVariants(isCreate),
    });
  }

  private saveVariants(isCreate: boolean) {
    if (!this.productId) {
      this.finishSave(isCreate);
      return;
    }

    const origVariants = this.originalVariants;
    const operations: { action: 'create' | 'update' | 'delete'; variant: any }[] = [];

    // Updates and creates
    for (const row of this.variantMatrix) {
      const existing = origVariants.find(
        (v: any) =>
          v.id &&
          (v.sizeId === row.sizeId || (!v.sizeId && !row.sizeId)) &&
          (v.colorId === row.colorId || (!v.colorId && !row.colorId)),
      );
      if (existing) {
        operations.push({
          action: 'update',
          variant: { ...existing, ...row },
        });
      } else {
        operations.push({
          action: 'create',
          variant: { ...row, id: null },
        });
      }
    }

    // Deletes
    for (const v of origVariants) {
      if (
        v.id &&
        !this.variantMatrix.some(
          (row) =>
            (v.sizeId === row.sizeId || (!v.sizeId && !row.sizeId)) &&
            (v.colorId === row.colorId || (!v.colorId && !row.colorId)),
        )
      ) {
        operations.push({ action: 'delete', variant: v });
      }
    }

    if (operations.length === 0) {
      this.finishSave(isCreate);
      return;
    }

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed >= operations.length) {
        this.finishSave(isCreate);
      }
    };

    for (const op of operations) {
      if (op.action === 'update') {
        this.http.put(`${API_URL}/products/variants/${op.variant.id}`, op.variant).subscribe({
          next: () => checkDone(),
          error: () => checkDone(),
        });
      } else if (op.action === 'create') {
        this.http.post(`${API_URL}/products/${this.productId}/variants`, op.variant).subscribe({
          next: () => checkDone(),
          error: () => checkDone(),
        });
      } else if (op.action === 'delete') {
        this.http.delete(`${API_URL}/products/variants/${op.variant.id}`).subscribe({
          next: () => checkDone(),
          error: () => checkDone(),
        });
      }
    }
  }

  private finishSave(isCreate: boolean) {
    this.saving = false;
    this.lastSavedAt = new Date();
    this.notify.success(
      isCreate ? 'Producto creado correctamente.' : 'Cambios guardados correctamente.',
      isCreate ? 'Creado' : 'Guardado',
    );
    this.cdr.detectChanges();
  }

  saveAsDraft() {
    this.form.patchValue({ isActive: false });
    this.save();
  }

  /* ─── Variant helpers ───────────────────────────────── */
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
}

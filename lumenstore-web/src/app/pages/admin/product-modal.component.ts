import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  Input,
  Output,
  EventEmitter,
  HostListener,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../services/api.service';
import { ProductService } from '../../services/product.service';
import { QuickCreateModalComponent, QuickCreateType } from './quick-create-modal.component';
import { BrandDTO, CategoryDTO, ColorDTO, SizeDTO } from '../../services/catalog-admin.service';
import { NotificationService } from '../../services/notification.service';
import { CloudinaryUrlPipe } from '../../pipes/cloudinary-url.pipe';
import { AdminModalComponent } from '../../components/admin/admin-modal.component';
import { AdminEmptyStateComponent } from '../../components/admin/admin-empty-state.component';
import { Subscription } from 'rxjs';

/* ─── Interfaces ────────────────────────────────────────── */

interface VariantMatrixRow {
  id: number | null;
  colorId: number | null;
  sizeId: number | null;
  colorName: string | null;
  sizeName: string | null;
  colorHex: string | null;
  sku: string;
  price: number | null;
  compareAtPrice: number | null;
  stock: number | null;
  isActive: boolean;
  images: string[];
  _isNew?: boolean;
}

interface BulkEditValues {
  price: number | null;
  compareAtPrice: number | null;
  stock: number | null;
  isActive: boolean | null;
}

/* ─── Constants ─────────────────────────────────────────── */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const SEO_TITLE_MAX = 60;
const SEO_DESC_MAX = 160;
const META_KEYWORDS_MAX = 500;

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    QuickCreateModalComponent,
    CloudinaryUrlPipe,
    AdminModalComponent,
    AdminEmptyStateComponent,
  ],
  templateUrl: './product-modal.component.html',
  styleUrls: ['./product-modal.component.scss'],
})
export class ProductModalComponent implements OnInit, OnDestroy {
  /* ─── Inputs / Outputs ──────────────────────────────── */
  @Input() open = false;
  @Input() productId: number | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  /* ─── Template refs ─────────────────────────────────── */
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('variantFileInput') variantFileInput!: ElementRef;
  @ViewChild('bulkImageInput') bulkImageInput!: ElementRef;
  @ViewChild('tagInput') tagInput!: ElementRef;

  /* ─── Form core ─────────────────────────────────────── */
  form!: FormGroup;
  loading = false;
  saving = false;
  isNew = false;
  productName = '';
  activeTab = 'general';

  /* ─── Subscription cleanup ──────────────────────────── */
  private slugSub?: Subscription;
  private categorySub?: Subscription;

  /* ─── Reference data ────────────────────────────────── */
  brands: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];
  sizes: any[] = [];
  colors: any[] = [];
  tags: string[] = [];
  tagInputValue = '';

  /* ─── Searchable dropdowns ──────────────────────────── */
  brandSearch = '';
  categorySearch = '';
  showBrandDropdown = false;
  showCategoryDropdown = false;

  /* ─── Slug ──────────────────────────────────────────── */
  slugLocked = true;
  slugManuallyEdited = false;
  slugChecking = false;

  /* ─── Variants ──────────────────────────────────────── */
  selectedColorIds: Set<number> = new Set();
  selectedSizeIds: Set<number> = new Set();
  variantMatrix: VariantMatrixRow[] = [];
  variants: any[] = [];
  showBulkEdit = false;
  bulkEditValues: BulkEditValues = {
    price: null,
    compareAtPrice: null,
    stock: null,
    isActive: null,
  };

  /* ─── Quick Create ──────────────────────────────────── */
  showQuickModal = false;
  quickModalType: QuickCreateType = 'brand';

  /* ─── General Images ────────────────────────────────── */
  images: any[] = [];
  dragOver = false;
  pendingFiles: File[] = [];
  pendingPreviews: { file: File; url: string }[] = [];
  uploadProgress = 0;
  isUploading = false;
  showDeleteImageModal = false;
  deleteImageTargetId: number | null = null;
  deletingImage = false;
  dragImageIndex: number | null = null;
  dragOverImageIndex: number | null = null;

  /* ─── Variant Images ────────────────────────────────── */
  selectedVariantIndex: number | null = null;

  /* ─── Variant Matrix Selection & Bulk ──────────────── */
  selectedVariantIds = new Set<number>();
  bulkMode: 'price' | 'stock' | null = null;
  bulkValue: number | null = null;

  /* ─── Image Popover ────────────────────────────────── */
  imagePopoverIndex: number | null = null;
  popoverDragOver = false;

  get allSelected(): boolean {
    return this.variantMatrix.length > 0 && this.selectedVariantIds.size === this.variantMatrix.length;
  }

  get popoverRow(): VariantMatrixRow | null {
    return this.imagePopoverIndex !== null ? this.variantMatrix[this.imagePopoverIndex] ?? null : null;
  }

  /* ─── SEO Preview ───────────────────────────────────── */
  seoPreviewUrl = '';
  seoPreviewTitle = '';
  seoPreviewDesc = '';

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
    private productService: ProductService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notify: NotificationService,
  ) {}

  /* ─── Lifecycle ─────────────────────────────────────── */
  ngOnInit(): void {
    this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && this.open) {
      this.initModal();
    }
  }

  ngOnDestroy(): void {
    this.slugSub?.unsubscribe();
    this.categorySub?.unsubscribe();
    this.pendingPreviews.forEach((p) => URL.revokeObjectURL(p.url));
  }

  /* ─── Host Listener ─────────────────────────────────── */
  @HostListener('window:keydown.escape')
  onEscKey() {
    if (this.open) {
      this.requestClose();
    }
  }

  @HostListener('window:keydown.control.s', ['$event'])
  @HostListener('window:keydown.meta.s', ['$event'])
  onSaveKey(event: Event) {
    if (this.open) {
      event.preventDefault();
      this.save();
    }
  }

  /* ─── Modal Init ────────────────────────────────────── */
  private initModal() {
    this.activeTab = 'general';
    this.loading = false;
    this.saving = false;
    this.productName = '';
    this.tags = [];
    this.variantMatrix = [];
    this.variants = [];
    this.images = [];
    this.pendingFiles = [];
    this.pendingPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    this.pendingPreviews = [];
    this.brandSearch = '';
    this.categorySearch = '';
    this.slugLocked = true;
    this.slugManuallyEdited = false;
    this.slugChecking = false;
    this.selectedColorIds.clear();
    this.selectedSizeIds.clear();
    this.showBulkEdit = false;
    this.selectedVariantIndex = null;
    this.subcategories = [];

    this.resetFormValues();
    this.loadReferenceData();

    if (this.productId) {
      this.isNew = false;
      this.loadProduct(this.productId);
    } else {
      this.isNew = true;
      this.setupAutoSlug();
    }
  }

  /* ─── Form Building ─────────────────────────────────── */
  private buildForm() {
    this.form = this.fb.group({
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
    });

    this.slugSub?.unsubscribe();
    this.slugSub = this.form.get('slug')?.valueChanges.subscribe((slug) => {
      if (slug && slug.length >= 3 && this.isNew) {
        this.checkSlugExists(slug);
      }
    }) as Subscription;

    this.categorySub?.unsubscribe();
    this.categorySub = this.form.get('categoryId')?.valueChanges.subscribe((catId) => {
      this.loadSubcategories(catId);
    }) as Subscription;
  }

  private resetFormValues() {
    this.form.reset({
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      sku: '',
      brandId: null,
      categoryId: null,
      featured: false,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
      metaKeywords: '',
    });
    this.form.get('slug')?.disable();
    this.slugLocked = true;
    this.slugManuallyEdited = false;
    this.slugChecking = false;
  }

  /* ─── Data Loading ──────────────────────────────────── */
  private loadReferenceData() {
    this.productService.getBrands().subscribe((bs) => {
      this.brands = bs || [];
      this.cdr.detectChanges();
    });
    this.productService.getCategories().subscribe((cs) => {
      this.categories = cs || [];
      this.cdr.detectChanges();
    });
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

  loadProduct(id: number) {
    this.loading = true;
    this.cdr.detectChanges();
    this.productService.getProductById(id).subscribe(
      (prod: any) => {
        this.isNew = false;
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
        });
        if (prod.brandName) this.brandSearch = prod.brandName;
        if (prod.categoryName) this.categorySearch = prod.categoryName;
        if (prod.categoryId) this.loadSubcategories(prod.categoryId);
        this.updateSeoPreview();
        this.setupAutoSlug();
        let pending = 3;
        const done = () => {
          pending--;
          if (pending <= 0) {
            this.loading = false;
            this.cdr.detectChanges();
          }
        };
        this.loadVariants(id, done);
        this.loadImages(id, done);
        this.loadTags(id, done);
      },
      () => {
        this.loading = false;
        this.cdr.detectChanges();
        this.notify.error('No se pudo cargar el producto.', 'Error al cargar');
        this.requestClose();
      },
    );
  }

  loadVariants(id: number, onDone?: () => void) {
    this.productService.getProductVariants(id).subscribe({
      next: (variants: any) => {
        this.variants = variants || [];
        this.rebuildMatrixFromVariants();
        this.cdr.detectChanges();
        onDone?.();
      },
      error: () => { onDone?.(); },
    });
  }

  loadImages(id: number, onDone?: () => void) {
    this.productService.getProductImages(id).subscribe({
      next: (imgs) => {
        this.images = imgs || [];
        this.cdr.detectChanges();
        onDone?.();
      },
      error: () => { onDone?.(); },
    });
  }

  loadTags(id: number, onDone?: () => void) {
    this.http.get(`${API_URL}/products/${id}/tags`).subscribe({
      next: (res: any) => {
        this.tags = Array.isArray(res) ? res : [];
        this.cdr.detectChanges();
        onDone?.();
      },
      error: () => { onDone?.(); },
    });
  }

  /* ─── Navigation / Tabs ─────────────────────────────── */
  setTab(tabId: string) {
    this.activeTab = tabId;
    this.cdr.detectChanges();
  }

  getSectionProgress(): number {
    let count = 0;
    if (this.form.get('name')?.valid && this.form.get('brandId')?.valid && this.form.get('categoryId')?.valid) count++;
    if (this.variantMatrix.length > 0) count++;
    if (this.images.length > 0 || this.pendingPreviews.length > 0) count++;
    if (this.form.get('metaTitle')?.value || this.form.get('metaDescription')?.value) count++;
    return count;
  }

  /* ─── Slug ──────────────────────────────────────────── */
  setupAutoSlug() {
    this.form.get('name')?.valueChanges.subscribe((name: string) => {
      if (!this.slugManuallyEdited && this.slugLocked) {
        const slug = this.toSlug(name);
        this.form.patchValue({ slug }, { emitEvent: false });
        this.updateSeoPreview();
      }
    });
  }

  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
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
    this.http.get(`${API_URL}/products/slug-exists?slug=${slug}`).subscribe({
      next: (res: any) => {
        this.slugChecking = false;
        if (res.exists) {
          this.form.get('slug')?.setErrors({ slugTaken: true });
        } else {
          this.form.get('slug')?.setErrors(null);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.slugChecking = false;
        this.cdr.detectChanges();
      },
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
    this.loadSubcategories(cat.id);
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

  /* ─── Variants ──────────────────────────────────────── */
  rebuildMatrixFromVariants() {
    this.selectedColorIds.clear();
    this.selectedSizeIds.clear();
    this.variantMatrix = [];

    for (const v of this.variants) {
      if (v.colorId) this.selectedColorIds.add(v.colorId);
      if (v.sizeId) this.selectedSizeIds.add(v.sizeId);
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
        row.price = match.price;
        row.compareAtPrice = match.compareAtPrice;
        row.stock = match.stock;
        row.isActive = match.isActive !== false;
        row.images = this.images
          .filter((img: any) => img.variantId === match.id)
          .sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map((img: any) => img.imageUrl);
      }
    }
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
        price: existing?.price ?? null,
        compareAtPrice: existing?.compareAtPrice ?? null,
        stock: existing?.stock ?? null,
        isActive: existing?.isActive !== false,
        images: [],
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

  toggleVariantActive(index: number) {
    if (this.variantMatrix[index]) {
      this.variantMatrix[index].isActive = !this.variantMatrix[index].isActive;
    }
  }

  /* ─── Selection & Bulk Mode ───────────────────────── */
  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedVariantIds.clear();
    } else {
      this.variantMatrix.forEach((_, i) => this.selectedVariantIds.add(i));
    }
  }

  toggleSelectVariant(i: number) {
    if (this.selectedVariantIds.has(i)) {
      this.selectedVariantIds.delete(i);
    } else {
      this.selectedVariantIds.add(i);
    }
  }

  toggleBulkMode(mode: 'price' | 'stock') {
    this.bulkMode = this.bulkMode === mode ? null : mode;
    this.bulkValue = null;
  }

  applyBulkMode() {
    if (this.bulkMode === null || this.bulkValue === null) return;
    if (this.bulkValue < 0) {
      this.notify.warning('El valor no puede ser negativo.', 'Valor inválido');
      return;
    }
    for (const i of this.selectedVariantIds) {
      const row = this.variantMatrix[i];
      if (!row) continue;
      if (this.bulkMode === 'price') row.price = this.bulkValue;
      if (this.bulkMode === 'stock') row.stock = this.bulkValue;
    }
    this.notify.success(`Valores aplicados a ${this.selectedVariantIds.size} variante(s).`, 'Edición masiva');
    this.bulkMode = null;
    this.bulkValue = null;
  }

  /* ─── Bulk Image Upload ──────────────────────────── */
  bulkImageFiles: { file: File; preview: string }[] = [];

  triggerBulkImageUpload() {
    if (this.selectedVariantIds.size === 0) {
      this.notify.warning('Selecciona al menos una variante.', 'Sin selección');
      return;
    }
    this.bulkImageInput?.nativeElement?.click();
  }

  onBulkImageSelected(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles = this.validateImageFiles(Array.from(files));
    if (validFiles.length === 0) return;

    for (const f of validFiles) {
      this.bulkImageFiles.push({ file: f, preview: URL.createObjectURL(f) });
    }

    if (event.target) event.target.value = '';
  }

  removeBulkImageFile(index: number) {
    URL.revokeObjectURL(this.bulkImageFiles[index].preview);
    this.bulkImageFiles.splice(index, 1);
  }

  confirmBulkImageUpload() {
    if (this.bulkImageFiles.length === 0 || this.selectedVariantIds.size === 0) return;

    if (!this.productId) {
      for (const i of this.selectedVariantIds) {
        const row = this.variantMatrix[i];
        if (row) {
          for (const item of this.bulkImageFiles) {
            row.images.push(item.preview);
          }
        }
      }
      this.notify.success(`${this.bulkImageFiles.length} imagen(es) asignada(s) a ${this.selectedVariantIds.size} variante(s).`);
      this.bulkImageFiles = [];
      return;
    }

    this.isUploading = true;
    const total = this.selectedVariantIds.size;
    const remaining = [...this.selectedVariantIds];
    const fileCount = this.bulkImageFiles.length;

    const uploadNext = () => {
      if (remaining.length === 0) {
        this.isUploading = false;
        this.bulkImageFiles = [];
        this.loadImages(this.productId!);
        this.notify.success(`${fileCount} imagen(es) asignada(s) a ${total} variante(s).`);
        this.cdr.detectChanges();
        return;
      }
      const idx = remaining.shift()!;
      const row = this.variantMatrix[idx];
      if (!row) { uploadNext(); return; }

      const formData = new FormData();
      for (const item of this.bulkImageFiles) {
        formData.append('files', item.file);
      }
      const variantIdParam = row.id ? `?variantId=${row.id}` : '';

      this.http.post(`${API_URL}/products/${this.productId}/images${variantIdParam}`, formData).subscribe({
        next: (res: any) => {
          if (res && res.length > 0) {
            for (const img of res) {
              row.images.push(img.imageUrl || img.url);
            }
          }
          uploadNext();
        },
        error: () => {
          uploadNext();
        },
      });
    };

    uploadNext();
  }

  /* ─── Image Popover ──────────────────────────────── */
  openImagePopover(index: number, event: Event) {
    event.stopPropagation();
    this.imagePopoverIndex = index;
    this.popoverDragOver = false;
  }

  closeImagePopover() {
    this.imagePopoverIndex = null;
    this.popoverDragOver = false;
  }

  onPopoverDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.popoverDragOver = true;
  }

  onPopoverDragLeave(event: DragEvent) {
    event.stopPropagation();
    this.popoverDragOver = false;
  }

  onPopoverDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.popoverDragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0 && this.imagePopoverIndex !== null) {
      this.uploadVariantImageFromFiles(this.imagePopoverIndex, files);
    }
  }

  private uploadVariantImageFromFiles(variantIndex: number, files: FileList) {
    const row = this.variantMatrix[variantIndex];
    if (!row) return;
    const validFiles = this.validateImageFiles(Array.from(files));
    if (validFiles.length === 0) return;
    if (this.productId) {
      this.isUploading = true;
      const formData = new FormData();
      validFiles.forEach(f => formData.append('files', f));
      const variantIdParam = row.id ? `?variantId=${row.id}` : '';
      this.http.post(`${API_URL}/products/${this.productId}/images${variantIdParam}`, formData).subscribe({
        next: (res: any) => {
          if (res && res.length > 0) {
            for (const img of res) {
              const url = img.imageUrl || img.url;
              row.images.push(url);
            }
          }
          this.isUploading = false;
          this.loadImages(this.productId!);
          this.notify.success(`${validFiles.length} imagen(es) asignada(s).`);
          this.cdr.detectChanges();
        },
        error: () => {
          this.isUploading = false;
          this.notify.error('No se pudieron subir las imágenes.', 'Error');
          this.cdr.detectChanges();
        },
      });
    } else {
      for (const f of validFiles) {
        row.images.push(URL.createObjectURL(f));
      }
    }
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
    const parts = input.split(',').map((t) => t.trim()).filter((t) => t.length > 0 && !this.tags.includes(t));
    if (parts.length > 0) {
      this.tags.push(...parts);
      this.tagInputValue = '';
      this.cdr.detectChanges();
    }
  }

  removeTag(index: number) {
    this.tags.splice(index, 1);
  }

  /* ─── General Images ────────────────────────────────── */
  onDragOver(event: DragEvent) { event.preventDefault(); this.dragOver = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.dragOver = false; }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) this.uploadGeneralImages(files);
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files && files.length > 0) this.uploadGeneralImages(files);
    if (event.target) event.target.value = '';
  }

  triggerFileInput() { this.fileInput?.nativeElement?.click(); }

  private validateImageFiles(files: File[]): File[] {
    const valid: File[] = [];
    const errors: string[] = [];
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": formato no permitido.`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errors.push(`"${file.name}": supera 10 MB.`);
        continue;
      }
      const alreadyPending = this.pendingPreviews.some((p) => p.file.name === file.name && p.file.size === file.size);
      if (alreadyPending) {
        errors.push(`"${file.name}": ya está en la cola de subida.`);
        continue;
      }
      valid.push(file);
    }
    if (errors.length > 0) this.notify.warning(errors.join(' '), 'Algunas imágenes no se pudieron agregar');
    return valid;
  }

  uploadGeneralImages(files: FileList) {
    const validFiles = this.validateImageFiles(Array.from(files));
    if (validFiles.length === 0) return;
    if (!this.productId) {
      for (const file of validFiles) {
        this.pendingFiles.push(file);
        this.pendingPreviews.push({ file, url: URL.createObjectURL(file) });
      }
      this.cdr.detectChanges();
      return;
    }
    this.sendGeneralImages(validFiles);
  }

  removePendingImage(index: number) {
    const preview = this.pendingPreviews[index];
    if (preview) URL.revokeObjectURL(preview.url);
    this.pendingPreviews.splice(index, 1);
    this.pendingFiles.splice(index, 1);
    this.cdr.detectChanges();
  }

  uploadPendingImagesNow() {
    if (!this.productId) {
      this.saveAndUploadPending();
      return;
    }
    this.uploadPendingImages();
  }

  private saveAndUploadPending() {
    const payload = { ...this.form.value, tags: this.tags, isActive: false };
    this.form.get('slug')?.enable();
    this.saving = true;
    this.productService.createProduct(payload).subscribe(
      (created: any) => {
        this.productId = created.id || created;
        this.isNew = false;
        this.uploadPendingImages();
        this.cdr.detectChanges();
      },
      (err) => {
        this.saving = false;
        this.cdr.detectChanges();
        this.notify.apiError(err, 'No se pudo crear el producto provisional.', 'Error');
      },
    );
  }

  private uploadPendingImages() {
    if (this.pendingFiles.length === 0 || !this.productId) return;
    const files = [...this.pendingFiles];
    this.pendingFiles = [];
    this.pendingPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    this.pendingPreviews = [];
    this.sendGeneralImages(files);
  }

  private sendGeneralImages(files: File[]) {
    this.isUploading = true;
    this.uploadProgress = 0;
    const formData = new FormData();
    for (const file of files) formData.append('files', file);
    this.http.post(`${API_URL}/products/${this.productId}/images`, formData, { reportProgress: true, observe: 'events' }).subscribe({
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
    });
  }

  confirmDeleteImage(imageId: number) { this.deleteImageTargetId = imageId; this.showDeleteImageModal = true; }
  cancelDeleteImage() { this.showDeleteImageModal = false; this.deleteImageTargetId = null; }

  executeDeleteImage() {
    if (!this.productId || !this.deleteImageTargetId) return;
    this.deletingImage = true;
    this.http.delete(`${API_URL}/products/${this.productId}/images/${this.deleteImageTargetId}`).subscribe({
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

  /* ─── Image Reorder ─────────────────────────────────── */
  onImageDragStart(index: number) { this.dragImageIndex = index; }
  onImageDragOver(event: DragEvent, index: number) { event.preventDefault(); this.dragOverImageIndex = index; }
  onImageDrop(event: DragEvent) {
    event.preventDefault();
    if (this.dragImageIndex !== null && this.dragOverImageIndex !== null && this.dragImageIndex !== this.dragOverImageIndex) {
      const [moved] = this.images.splice(this.dragImageIndex, 1);
      this.images.splice(this.dragOverImageIndex, 0, moved);
    }
    this.dragImageIndex = null;
    this.dragOverImageIndex = null;
  }
  onImageDragEnd() { this.dragImageIndex = null; this.dragOverImageIndex = null; }

  /* ─── Variant Image Upload ──────────────────────────── */
  openImagePickerForVariant(variantIndex: number) {
    this.selectedVariantIndex = variantIndex;
    setTimeout(() => this.variantFileInput?.nativeElement?.click(), 0);
  }

  onVariantFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file || this.selectedVariantIndex === null) return;

    const row = this.variantMatrix[this.selectedVariantIndex];
    if (!row) return;

    const validFiles = this.validateImageFiles([file]);
    if (validFiles.length === 0) return;

    if (this.productId) {
      this.isUploading = true;
      const formData = new FormData();
      formData.append('files', file);
      const variantIdParam = row.id ? `?variantId=${row.id}` : '';
      this.http.post(`${API_URL}/products/${this.productId}/images${variantIdParam}`, formData).subscribe({
        next: (res: any) => {
          if (res && res.length > 0) {
            const url = res[0].imageUrl || res[0].url;
            row.images.push(url);
          }
          this.isUploading = false;
          this.loadImages(this.productId!);
          this.notify.success('Imagen asignada a la variante.');
          this.cdr.detectChanges();
        },
        error: () => {
          this.isUploading = false;
          this.notify.error('No se pudo asignar la imagen.', 'Error');
          this.cdr.detectChanges();
        },
      });
    } else {
      row.images.push(URL.createObjectURL(file));
    }

    this.selectedVariantIndex = null;
    if (event.target) event.target.value = '';
  }

  removeVariantImage(variantIndex: number, imageIndex: number) {
    const row = this.variantMatrix[variantIndex];
    if (!row) return;
    row.images.splice(imageIndex, 1);
    this.cdr.detectChanges();
  }

  /* ─── SEO Preview ───────────────────────────────────── */
  private updateSeoPreview() {
    const slug = this.form?.get('slug')?.value || 'producto';
    this.seoPreviewUrl = `https://lumenstore.pe/producto/${slug}`;
    this.seoPreviewTitle = this.form?.get('metaTitle')?.value || this.form?.get('name')?.value || 'Título del producto';
    this.seoPreviewDesc = this.form?.get('metaDescription')?.value || this.form?.get('shortDescription')?.value || '';
  }

  /* ─── Save ──────────────────────────────────────────── */
  private originalVariants: any[] = [];

  generateVariantsFromMatrix() {
    this.variants = this.variantMatrix.map((row) => ({
      id: row.id,
      sku: row.sku,
      sizeId: row.sizeId,
      colorId: row.colorId,
      sizeName: row.sizeName,
      colorName: row.colorName,
      price: row.price,
      compareAtPrice: row.compareAtPrice,
      stock: row.stock,
      isActive: row.isActive,
      _isNew: !row.id,
    }));
  }

  save() {
    return this.executeSave(true);
  }

  saveAsDraft() {
    this.form.patchValue({ isActive: false });
    this.executeSave(false);
  }

  private executeSave(requireVariantPrices: boolean) {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.warning('Revisa los campos obligatorios.', 'Formulario incompleto');
      return;
    }

    this.originalVariants = this.variants.map((v) => ({ ...v }));
    this.generateVariantsFromMatrix();

    const negativePrice = this.variantMatrix.find((r) => r.price !== null && r.price < 0);
    if (negativePrice) {
      this.notify.warning(
        `La variante "${this.getVariantLabel(negativePrice)}" tiene precio negativo. El precio no puede ser menor a 0.`,
        'Valor inválido',
      );
      return;
    }

    const negativeStock = this.variantMatrix.find((r) => r.stock !== null && r.stock < 0);
    if (negativeStock) {
      this.notify.warning(
        `La variante "${this.getVariantLabel(negativeStock)}" tiene stock negativo. El stock no puede ser menor a 0.`,
        'Valor inválido',
      );
      return;
    }

    if (requireVariantPrices) {
      if (this.variantMatrix.length === 0) {
        this.notify.warning('Agrega al menos una variante para publicar el producto.', 'Sin variantes');
        return;
      }

      const hasAtLeastOnePriced = this.variantMatrix.some(
        (r) => r.price !== null && r.price > 0
      );
      if (!hasAtLeastOnePriced) {
        this.notify.warning('Al menos una variante debe tener precio para publicar.', 'Precio requerido');
        return;
      }

      const stockWithoutPrice = this.variantMatrix.find(
        (r) => (r.stock ?? 0) > 0 && (!r.price || r.price <= 0)
      );
      if (stockWithoutPrice) {
        this.notify.warning(
          `La variante "${this.getVariantLabel(stockWithoutPrice)}" tiene stock pero precio 0. Ajusta el precio.`,
          'Precio requerido',
        );
        return;
      }
    }

    this.saving = true;
    this.cdr.detectChanges();

    this.form.get('slug')?.enable();
    const payload = { ...this.form.value, tags: this.tags };

    if (this.isNew) {
      this.productService.createProduct(payload).subscribe(
        (created: any) => {
          this.productId = created.id || created;
          this.isNew = false;
          this.http.get<any[]>(`${API_URL}/products/${this.productId}/variants`).subscribe({
            next: (serverVariants) => {
              this.originalVariants = serverVariants;
              this.uploadPendingImages();
              this.saveTagsAndVariants(true);
            },
            error: () => {
              this.originalVariants = [];
              this.uploadPendingImages();
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
          this.uploadPendingImages();
          this.saveTagsAndVariants(false);
        },
        (err) => {
          this.saving = false;
          this.cdr.detectChanges();
          this.notify.apiError(err, 'No se pudo actualizar.', 'Error');
        },
      );
    }
  }

  private saveTagsAndVariants(isCreate: boolean) {
    if (!this.productId) { this.finishSave(isCreate); return; }

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
    if (!this.productId) { this.finishSave(isCreate); return; }

    const origVariants = this.originalVariants;
    const operations: { action: 'create' | 'update' | 'delete'; variant: any }[] = [];

    for (const row of this.variantMatrix) {
      const existing = origVariants.find(
        (v: any) =>
          v.id &&
          (v.sizeId === row.sizeId || (!v.sizeId && !row.sizeId)) &&
          (v.colorId === row.colorId || (!v.colorId && !row.colorId)),
      );
      if (existing) {
        operations.push({ action: 'update', variant: { ...existing, ...row } });
      } else {
        operations.push({ action: 'create', variant: { ...row, id: null } });
      }
    }

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

    if (operations.length === 0) { this.finishSave(isCreate); return; }

    let completed = 0;
    const checkDone = () => {
      completed++;
      if (completed >= operations.length) this.finishSave(isCreate);
    };

    for (const op of operations) {
      if (op.action === 'update') {
        this.http.put(`${API_URL}/products/variants/${op.variant.id}`, op.variant).subscribe({ next: () => checkDone(), error: () => checkDone() });
      } else if (op.action === 'create') {
        this.http.post(`${API_URL}/products/${this.productId}/variants`, op.variant).subscribe({ next: () => checkDone(), error: () => checkDone() });
      } else if (op.action === 'delete') {
        this.http.delete(`${API_URL}/products/variants/${op.variant.id}`).subscribe({ next: () => checkDone(), error: () => checkDone() });
      }
    }
  }

  private finishSave(isCreate: boolean) {
    this.saving = false;
    this.notify.success(
      isCreate ? 'Producto creado correctamente.' : 'Cambios guardados correctamente.',
      isCreate ? 'Creado' : 'Guardado',
    );
    this.cdr.detectChanges();
    this.saved.emit();
    this.requestClose();
  }

  /* ─── Close ─────────────────────────────────────────── */
  requestClose() {
    this.close.emit();
  }

  /* ─── Variant Helpers ───────────────────────────────── */
  getVariantLabel(v: any): string {
    const parts: string[] = [];
    if (v.sizeName) parts.push(v.sizeName);
    if (v.colorName) parts.push(v.colorName);
    return parts.length ? parts.join(' / ') : 'Única';
  }

  getVariantHint(row: VariantMatrixRow): string | null {
    if (row.price !== null && row.price < 0) return 'Precio no puede ser negativo';
    if (row.stock !== null && row.stock < 0) return 'Stock no puede ser negativo';
    if ((row.stock ?? 0) > 0 && (!row.price || row.price <= 0)) return 'Precio requerido';
    if (!row.price || row.price <= 0) return 'Sin precio';
    return null;
  }

  getColorHex(colorId: number): string {
    const c = this.colors.find((col) => col.id === colorId);
    return c ? c.hexCode : '';
  }
}

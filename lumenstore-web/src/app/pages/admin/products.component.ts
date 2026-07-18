import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../services/notification.service';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { AdminPageHeaderComponent } from '../../components/admin/admin-page-header.component';
import { AdminButtonComponent } from '../../components/admin/admin-button.component';
import { AdminBadgeComponent } from '../../components/admin/admin-badge.component';
import { AdminEmptyStateComponent } from '../../components/admin/admin-empty-state.component';
import { AdminSkeletonComponent } from '../../components/admin/admin-skeleton.component';
import { ProductModalComponent } from './product-modal.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    AdminPageHeaderComponent,
    AdminButtonComponent,
    AdminBadgeComponent,
    AdminEmptyStateComponent,
    AdminSkeletonComponent,
    ProductModalComponent,
  ],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class AdminProductsComponent implements OnInit, OnDestroy {
  // ─── Data ────────────────────────────────────────────────────
  // allProducts: TODOS los productos que matchean los filtros de servidor
  // (búsqueda + estado activo/inactivo). Se traen en un solo llamado para
  // poder ordenar, filtrar por stock bajo y paginar de forma consistente
  // sobre el set completo, no solo sobre una página de 10.
  allProducts: any[] = [];
  // filteredProducts: allProducts luego de aplicar el filtro de stock bajo
  // y el ordenamiento — es la base real de la paginación.
  filteredProducts: any[] = [];
  // pagedProducts: la porción de filteredProducts que corresponde a la
  // página actual (currentPage/pageSize), lo que efectivamente se muestra.
  pagedProducts: any[] = [];

  // Límite práctico de productos a traer en un solo llamado. Es un catálogo
  // de administración (no scroll infinito de tienda), por lo que traer todo
  // de una vez permite ordenar/filtrar/paginar correctamente en el cliente.
  // Si el catálogo llega a superar este número, se debería migrar el orden
  // y el filtro de stock bajo a consultas agregadas en el backend.
  private static readonly MAX_FETCH_SIZE = 1000;

  totalElements = 0;

  // UI state
  loading = true;
  error: string | null = null;

  // Search & Filters
  searchQuery = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  filterStockLow = false;
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  // Pagination — ahora 100% client-side sobre filteredProducts
  currentPage = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 20, 50];

  // Sorting
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Bulk selection
  selectedIds: Set<number> = new Set();
  selectAllChecked = false;

  // Delete confirmation modal
  showDeleteModal = false;
  deleteTargetId: number | null = null;
  deleteMultipleMode = false;

  // Toggle status loading
  togglingStatus: Set<number> = new Set();
  bulkActionInProgress = false;

  // Product Modal State
  showProductModal = false;
  editingProductId: number | null = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
    private notify: NotificationService,
  ) {}

  ngOnInit() {
    // Setup debounced search
    this.searchSubject
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 0;
        this.loadProducts();
      });

    this.loadProducts();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get totalPages(): number {
    return this.totalElements > 0 ? Math.ceil(this.totalElements / this.pageSize) : 1;
  }

  get startItem(): number {
    return this.totalElements === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  /**
   * Trae del backend TODOS los productos que matchean los filtros de
   * servidor (búsqueda + estado). Se llama solo cuando cambia alguno de
   * esos filtros; el resto de las interacciones (orden, stock bajo,
   * paginación) se resuelven localmente contra allProducts sin ida y
   * vuelta al servidor.
   */
  loadProducts() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    const filters: any = {};
    if (this.searchQuery.trim()) filters.query = this.searchQuery.trim();
    if (this.filterStatus === 'active') filters.isActive = true;
    if (this.filterStatus === 'inactive') filters.isActive = false;

    this.productService
      .getAdminProducts(filters, 0, AdminProductsComponent.MAX_FETCH_SIZE)
      .subscribe({
        next: (resp: any) => {
          this.allProducts = resp?.content || resp || [];
          this.applyLocalFilters();
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('[AdminProducts] Error:', err);
          this.error = 'No se pudieron cargar los productos.';
          this.notify.apiError(err, 'No se pudieron cargar los productos.', 'Error al cargar');
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ─── Search & Filters ──────────────────────────────────────

  /**
   * Aplica, en orden, sobre allProducts: filtro de stock bajo -> orden ->
   * paginación. Se recalcula totalElements a partir del resultado
   * filtrado, así el contador y los controles de paginación siempre
   * reflejan lo que realmente se está mostrando.
   */
  private applyLocalFilters() {
    let filtered = [...this.allProducts];

    if (this.filterStockLow) {
      filtered = filtered.filter((p) => (p.stock ?? 0) < 10);
    }

    const sortCol = this.sortColumn;
    if (sortCol) {
      filtered.sort((a, b) => {
        let valA: number | string, valB: number | string;
        if (sortCol === 'price') {
          valA = a.basePrice ?? 0;
          valB = b.basePrice ?? 0;
        } else if (sortCol === 'stock') {
          valA = a.stock ?? 0;
          valB = b.stock ?? 0;
        } else {
          valA = a[sortCol] ?? '';
          valB = b[sortCol] ?? '';
        }
        if (typeof valA === 'string') {
          return this.sortDirection === 'asc'
            ? valA.localeCompare(valB as string)
            : (valB as string).localeCompare(valA);
        }
        return this.sortDirection === 'asc' ? valA - (valB as number) : (valB as number) - valA;
      });
    }

    this.filteredProducts = filtered;
    this.totalElements = filtered.length;

    // Si el filtro/orden deja la página actual fuera de rango (p. ej. se
    // filtró la mayoría de los productos), volvemos a la primera página en
    // vez de mostrar una lista vacía de forma confusa.
    if (this.currentPage > 0 && this.currentPage >= this.totalPages) {
      this.currentPage = 0;
    }

    const start = this.currentPage * this.pageSize;
    this.pagedProducts = filtered.slice(start, start + this.pageSize);

    this.selectedIds.clear();
    this.selectAllChecked = false;
  }

  onSearchChange() {
    this.searchSubject.next(this.searchQuery);
  }

  onFilterStockLowChange() {
    this.currentPage = 0;
    this.applyLocalFilters();
  }

  onFilterStatusChange(status: 'all' | 'active' | 'inactive') {
    this.filterStatus = status;
    this.currentPage = 0;
    this.loadProducts();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStockLow = false;
    this.filterStatus = 'all';
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.currentPage = 0;
    this.loadProducts();
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchQuery.trim() !== '' ||
      this.filterStockLow ||
      this.filterStatus !== 'all' ||
      this.sortColumn !== null
    );
  }

  // ─── Pagination (client-side sobre el set ya filtrado) ─────

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.applyLocalFilters();
  }

  onPageSizeChange() {
    this.currentPage = 0;
    this.applyLocalFilters();
  }

  // ─── Sorting ───────────────────────────────────────────────

  toggleSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 0;
    this.applyLocalFilters();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  // ─── Bulk Selection ────────────────────────────────────────

  toggleSelectAll() {
    this.selectAllChecked = !this.selectAllChecked;
    if (this.selectAllChecked) {
      this.pagedProducts.forEach((p) => this.selectedIds.add(p.id));
    } else {
      this.selectedIds.clear();
    }
  }

  toggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.selectAllChecked = this.pagedProducts.every((p) => this.selectedIds.has(p.id));
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get selectedProducts(): any[] {
    return this.allProducts.filter((p) => this.selectedIds.has(p.id));
  }

  get allSelectedActive(): boolean {
    const sel = this.selectedProducts;
    return sel.length > 0 && sel.every((p) => p.isActive);
  }

  get allSelectedInactive(): boolean {
    const sel = this.selectedProducts;
    return sel.length > 0 && sel.every((p) => !p.isActive);
  }

  // ─── Bulk Actions ──────────────────────────────────────────
  // Usan ProductService (en vez de armar URLs con HttpClient directamente
  // en el componente) para mantener toda la lógica de acceso a la API en
  // una sola capa, consistente con el resto de operaciones CRUD.

  bulkDelete() {
    if (this.selectedIds.size === 0 || this.bulkActionInProgress) return;
    this.deleteMultipleMode = true;
    this.showDeleteModal = true;
  }

  bulkToggleActive(targetActive: boolean) {
    if (this.selectedIds.size === 0 || this.bulkActionInProgress) return;
    this.bulkActionInProgress = true;
    const ids = Array.from(this.selectedIds);

    forkJoin(
      ids.map((id) =>
        this.productService.updateProduct(id, { isActive: targetActive }).pipe(
          catchError(() => of(null)),
        ),
      ),
    ).subscribe((results) => {
      const succeeded = results.filter((r) => r !== null).length;
      const failed = results.length - succeeded;
      this.bulkActionInProgress = false;
      this.finishBulkToggle(succeeded, failed, targetActive);
    });
  }

  private finishBulkToggle(succeeded: number, failed: number, targetActive: boolean) {
    this.loadProducts();
    const action = targetActive ? 'activaron' : 'desactivaron';
    if (failed === 0) {
      this.notify.success(`Se ${action} ${succeeded} producto(s) correctamente.`, 'Listo');
    } else {
      this.notify.warning(
        `Se ${action} ${succeeded} producto(s), pero ${failed} no se pudieron actualizar.`,
        'Actualización parcial',
      );
    }
  }

  // ─── Toggle Status (inline) ────────────────────────────────

  toggleStatus(product: any) {
    if (this.togglingStatus.has(product.id)) return;
    this.togglingStatus.add(product.id);
    const newStatus = !product.isActive;
    this.productService.updateProduct(product.id, { isActive: newStatus }).subscribe({
      next: () => {
        product.isActive = newStatus;
        this.togglingStatus.delete(product.id);
        this.notify.success(
          newStatus ? `"${product.name}" fue activado.` : `"${product.name}" fue desactivado.`,
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.togglingStatus.delete(product.id);
        this.notify.apiError(err, 'No se pudo cambiar el estado del producto.', 'Error');
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Delete Confirmation ───────────────────────────────────

  confirmDelete(id: number) {
    this.deleteTargetId = id;
    this.deleteMultipleMode = false;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    if (this.bulkActionInProgress) return;
    this.showDeleteModal = false;
    this.deleteTargetId = null;
    this.deleteMultipleMode = false;
  }

  executeDelete() {
    if (this.bulkActionInProgress) return;

    if (this.deleteMultipleMode) {
      const ids = Array.from(this.selectedIds);
      this.bulkActionInProgress = true;
      forkJoin(
        ids.map((id) =>
          this.productService.deleteProduct(id).pipe(catchError(() => of(null))),
        ),
      ).subscribe((results) => {
        const failed = results.filter((r) => r === null).length;
        this.bulkActionInProgress = false;
        this.finishBulkDelete(results.length - failed, failed);
      });
    } else if (this.deleteTargetId) {
      const target = this.allProducts.find((p) => p.id === this.deleteTargetId);
      this.bulkActionInProgress = true;
      this.productService.deleteProduct(this.deleteTargetId).subscribe({
        next: () => {
          this.bulkActionInProgress = false;
          this.showDeleteModal = false;
          this.deleteTargetId = null;
          this.notify.success(
            target ? `"${target.name}" fue eliminado del catálogo.` : 'Producto eliminado.',
            'Producto eliminado',
          );
          this.loadProducts();
        },
        error: (err) => {
          this.bulkActionInProgress = false;
          this.showDeleteModal = false;
          this.deleteTargetId = null;
          this.notify.apiError(err, 'No se pudo eliminar el producto.', 'Error al eliminar');
        },
      });
    }
  }

  private finishBulkDelete(succeeded: number, failed: number) {
    this.showDeleteModal = false;
    this.deleteMultipleMode = false;
    this.loadProducts();
    if (failed === 0) {
      this.notify.success(
        `Se eliminaron ${succeeded} producto(s) correctamente.`,
        'Productos eliminados',
      );
    } else {
      this.notify.warning(
        `Se eliminaron ${succeeded} producto(s), pero ${failed} no se pudieron eliminar.`,
        'Eliminación parcial',
      );
    }
  }

  // ─── Navigation ────────────────────────────────────────────

  edit(id: number) {
    this.editingProductId = id;
    this.showProductModal = true;
  }

  create() {
    this.editingProductId = null;
    this.showProductModal = true;
  }

  onModalClose() {
    this.showProductModal = false;
    this.editingProductId = null;
  }

  onProductSaved() {
    this.loadProducts();
  }

  getStoreUrl(slug: string): string {
    return `/store/${slug}`;
  }

  // ─── Dynamic Pricing ─────────────────────────────────────────

  getPriceRange(p: any): { min: number; max: number } | null {
    if (p.variants && p.variants.length > 0) {
      const prices = p.variants
        .filter((v: any) => v.price != null && v.price > 0)
        .map((v: any) => Number(v.price));
      if (prices.length > 0) {
        return { min: Math.min(...prices), max: Math.max(...prices) };
      }
    }
    const base = p.price || p.basePrice || 0;
    if (base > 0) return { min: base, max: base };
    return null;
  }

  formatPriceRange(p: any): string {
    const range = this.getPriceRange(p);
    if (!range) return '—';
    if (range.min === range.max) {
      return 'S/. ' + range.min.toFixed(2);
    }
    return 'S/. ' + range.min.toFixed(2) + ' - S/. ' + range.max.toFixed(2);
  }

  formatPrice(p: any): string {
    const val = p.price || p.basePrice || 0;
    return 'S/. ' + val.toFixed(2);
  }

  // ─── Helpers ───────────────────────────────────────────────

  isLowStock(stock: number): boolean {
    return stock != null && stock < 10;
  }
}

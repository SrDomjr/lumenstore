import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { API_URL } from '../../services/api.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
})
export class AdminProductsComponent implements OnInit {
  // Data
  allProducts: any[] = [];
  filteredProducts: any[] = [];
  pagedProducts: any[] = [];

  // UI state
  loading = true;
  error: string | null = null;

  // Search & Filters
  searchQuery = '';
  filterStockLow = false;
  filterStatus: 'all' | 'active' | 'inactive' = 'all';

  // Pagination
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private productService: ProductService,
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize) || 1;
  }

  get startItem(): number {
    return this.filteredProducts.length === 0 ? 0 : this.currentPage * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.filteredProducts.length);
  }

  loadProducts() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.http.get(`${API_URL}/products/admin?page=0&size=1000`).subscribe({
      next: (resp: any) => {
        this.allProducts = resp?.content || resp || [];
        this.applyFilters();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('[AdminProducts] Error:', err);
        this.error = 'No se pudieron cargar los productos.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Search & Filters ──────────────────────────────────────

  applyFilters() {
    let filtered = [...this.allProducts];

    // Search by name or SKU
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name || p.title || p.nombre || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q),
      );
    }

    // Filter by stock < 10
    if (this.filterStockLow) {
      filtered = filtered.filter((p) => (p.stock ?? 0) < 10);
    }

    // Filter by status
    if (this.filterStatus === 'active') {
      filtered = filtered.filter((p) => p.isActive);
    } else if (this.filterStatus === 'inactive') {
      filtered = filtered.filter((p) => !p.isActive);
    }

    // Apply sorting
    const sortCol = this.sortColumn;
    if (sortCol) {
      filtered.sort((a, b) => {
        let valA: number | string, valB: number | string;
        if (sortCol === 'price') {
          valA = a.price || a.basePrice || 0;
          valB = b.price || b.basePrice || 0;
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
    this.currentPage = 0;
    this.updatePagedProducts();
    this.selectedIds.clear();
    this.selectAllChecked = false;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onFilterStockLowChange() {
    this.applyFilters();
  }

  onFilterStatusChange(status: 'all' | 'active' | 'inactive') {
    this.filterStatus = status;
    this.applyFilters();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filterStockLow = false;
    this.filterStatus = 'all';
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchQuery.trim() !== '' ||
      this.filterStockLow ||
      this.filterStatus !== 'all' ||
      this.sortColumn !== null
    );
  }

  // ─── Pagination ────────────────────────────────────────────

  updatePagedProducts() {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.pagedProducts = this.filteredProducts.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 0 || page >= this.totalPages) return;
    this.currentPage = page;
    this.updatePagedProducts();
    this.selectedIds.clear();
    this.selectAllChecked = false;
  }

  onPageSizeChange() {
    this.currentPage = 0;
    this.updatePagedProducts();
    this.selectedIds.clear();
    this.selectAllChecked = false;
  }

  // ─── Sorting ───────────────────────────────────────────────

  toggleSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
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

  bulkDelete() {
    if (this.selectedIds.size === 0) return;
    this.deleteMultipleMode = true;
    this.showDeleteModal = true;
  }

  bulkToggleActive(targetActive: boolean) {
    if (this.selectedIds.size === 0) return;
    const ids = Array.from(this.selectedIds);
    let completed = 0;
    ids.forEach((id) => {
      this.http.put(`${API_URL}/products/${id}`, { isActive: targetActive }).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.loadProducts();
          }
        },
        error: () => {
          completed++;
          if (completed === ids.length) {
            this.loadProducts();
          }
        },
      });
    });
  }

  // ─── Toggle Status (inline) ────────────────────────────────

  toggleStatus(product: any) {
    if (this.togglingStatus.has(product.id)) return;
    this.togglingStatus.add(product.id);
    const newStatus = !product.isActive;
    this.http.put(`${API_URL}/products/${product.id}`, { isActive: newStatus }).subscribe({
      next: () => {
        product.isActive = newStatus;
        this.togglingStatus.delete(product.id);
        this.cdr.detectChanges();
      },
      error: () => {
        this.togglingStatus.delete(product.id);
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
    this.showDeleteModal = false;
    this.deleteTargetId = null;
    this.deleteMultipleMode = false;
  }

  executeDelete() {
    if (this.deleteMultipleMode) {
      // Bulk delete
      const ids = Array.from(this.selectedIds);
      let completed = 0;
      ids.forEach((id) => {
        this.http.delete(`${API_URL}/products/${id}`).subscribe({
          next: () => {
            completed++;
            if (completed === ids.length) {
              this.showDeleteModal = false;
              this.deleteMultipleMode = false;
              this.loadProducts();
            }
          },
          error: () => {
            completed++;
            if (completed === ids.length) {
              this.showDeleteModal = false;
              this.deleteMultipleMode = false;
              this.loadProducts();
            }
          },
        });
      });
    } else if (this.deleteTargetId) {
      this.http.delete(`${API_URL}/products/${this.deleteTargetId}`).subscribe({
        next: () => {
          this.showDeleteModal = false;
          this.deleteTargetId = null;
          this.loadProducts();
        },
        error: () => {
          this.showDeleteModal = false;
          this.deleteTargetId = null;
          alert('Error al eliminar el producto.');
        },
      });
    }
  }

  // ─── Navigation ────────────────────────────────────────────

  edit(id: number) {
    this.router.navigate(['/admin/products', id, 'edit']);
  }

  create() {
    this.router.navigate(['/admin/products', 'new']);
  }

  getStoreUrl(slug: string): string {
    return `/store/${slug}`;
  }

  // ─── Dynamic Pricing ─────────────────────────────────────────
  // Returns min and max prices from variants for display
  getPriceRange(p: any): { min: number; max: number } | null {
    if (p.variants && p.variants.length > 0) {
      const prices = p.variants
        .filter((v: any) => v.price != null && v.price > 0)
        .map((v: any) => Number(v.price));
      if (prices.length > 0) {
        return { min: Math.min(...prices), max: Math.max(...prices) };
      }
    }
    // Fallback: use basePrice
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

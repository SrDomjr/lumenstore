import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { CatalogAdminService, CategoryDTO } from '../../services/catalog-admin.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-panel">
        <div class="header-panel">
          <div>
            <span class="eyebrow">Catálogo</span>
            <h1>Categorías</h1>
          </div>
        </div>

        <div class="two-col-layout">
          <!-- Left: Quick Create Form -->
          <div class="col-form">
            <div class="form-card">
              <h3 class="form-title">Nueva categoría</h3>
              <div class="form-group">
                <label>Nombre *</label>
                <input
                  class="form-control"
                  [(ngModel)]="newItem.name"
                  placeholder="Ej: Electrónicos"
                  (keydown.enter)="create()"
                />
              </div>
              <div class="form-group">
                <label>Descripción</label>
                <textarea
                  class="form-control"
                  [(ngModel)]="newItem.description"
                  placeholder="Descripción opcional"
                  rows="2"
                ></textarea>
              </div>
              <button
                class="btn btn-primary"
                (click)="create()"
                [disabled]="!newItem.name.trim() || saving"
              >
                {{ saving ? 'Guardando...' : 'Crear categoría' }}
              </button>
            </div>
          </div>

          <!-- Right: Table -->
          <div class="col-table">
            <div class="table-card">
              <div *ngIf="loading" class="loading-state">Cargando categorías...</div>
              <div *ngIf="error" class="alert alert-danger">{{ error }}</div>

              <div class="table-wrap" *ngIf="!loading && items.length > 0">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Slug</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of items">
                      <td class="cell-id">#{{ item.id }}</td>
                      <td>
                        <strong>{{ item.name }}</strong>
                        <small *ngIf="item.description" class="text-muted">{{
                          item.description
                        }}</small>
                      </td>
                      <td class="cell-slug">{{ item.slug }}</td>
                      <td>
                        <span class="status-badge" [class.active]="item.isActive !== false">
                          {{ item.isActive !== false ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="cell-actions">
                        <button class="action-link text-danger" (click)="deleteItem(item)">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div *ngIf="!loading && items.length === 0" class="empty-state">
                <p>No hay categorías registradas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .admin-page {
        padding: 48px;
        background: #fafafa;
        min-height: 100vh;
        color: #111;
      }
      .page-panel {
        max-width: 1200px;
      }
      .header-panel {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 40px;
      }
      .eyebrow {
        display: inline-block;
        font-size: 0.65rem;
        font-weight: 500;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: #999;
        margin-bottom: 8px;
      }
      h1 {
        margin: 0;
        font-size: 2.4rem;
        font-weight: 300;
        letter-spacing: -0.03em;
        line-height: 1.1;
        color: #111;
      }
      .two-col-layout {
        display: grid;
        grid-template-columns: 360px 1fr;
        gap: 32px;
        align-items: start;
      }
      @media (max-width: 900px) {
        .two-col-layout {
          grid-template-columns: 1fr;
        }
        .admin-page {
          padding: 32px 20px;
        }
      }
      .form-card,
      .table-card {
        background: #fff;
        border: 1px solid #e5e5e5;
        padding: 32px;
      }
      .form-title {
        margin: 0 0 24px;
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #111;
      }
      .form-group {
        margin-bottom: 20px;
      }
      .form-group label {
        display: block;
        margin-bottom: 6px;
        font-size: 0.7rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #111;
      }
      .form-control {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #e5e5e5;
        background: #fff;
        font-size: 0.85rem;
        color: #111;
        outline: none;
        transition: border-color 0.2s ease;
      }
      .form-control:focus {
        border-color: #111;
      }
      .form-control::placeholder {
        color: #bbb;
      }
      .btn-primary {
        background: #111;
        color: #fff;
        border: 1px solid #111;
        padding: 12px 24px;
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-primary:hover:not(:disabled) {
        background: #333;
        border-color: #333;
      }
      .btn-primary:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .admin-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
      }
      .admin-table th,
      .admin-table td {
        padding: 14px 16px;
        text-align: left;
        border-bottom: 1px solid #e5e5e5;
      }
      .admin-table th {
        font-size: 0.6rem;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #999;
        font-weight: 600;
      }
      .admin-table tbody tr:last-child td {
        border-bottom: none;
      }
      .admin-table tbody tr:hover {
        background: #fdfdfd;
      }
      .cell-id {
        color: #999;
        font-size: 0.8rem;
        width: 50px;
      }
      .cell-slug {
        color: #767676;
        font-size: 0.8rem;
      }
      .cell-actions {
        white-space: nowrap;
      }
      .text-muted {
        display: block;
        font-size: 0.75rem;
        color: #999;
        margin-top: 2px;
      }
      .status-badge {
        display: inline-block;
        font-size: 0.65rem;
        font-weight: 500;
        letter-spacing: 0.05em;
        color: #999;
        background: #f5f5f5;
        padding: 2px 10px;
      }
      .status-badge.active {
        color: #111;
        background: #f0f0f0;
      }
      .action-link {
        background: none;
        border: none;
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        cursor: pointer;
        padding: 0;
        margin-right: 12px;
        transition: color 0.2s ease;
      }
      .action-link.text-danger {
        color: #767676;
      }
      .action-link.text-danger:hover {
        color: #111;
      }
      .loading-state,
      .empty-state {
        padding: 40px 24px;
        text-align: center;
        color: #999;
        font-size: 0.85rem;
      }
      .alert-danger {
        padding: 12px 16px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #991b1b;
        font-size: 0.85rem;
        margin-bottom: 16px;
      }
    `,
  ],
})
export class AdminCategoriesComponent implements OnInit {
  items: CategoryDTO[] = [];
  loading = true;
  error: string | null = null;
  saving = false;
  newItem = { name: '', description: '' };

  constructor(
    private catalogService: CatalogAdminService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.catalogService
      .getCategories()
      .pipe(
        catchError((err) => {
          this.error = 'Error al cargar categorías';
          this.loading = false;
          return of([]);
        }),
      )
      .subscribe((items) => {
        this.items = items;
        this.loading = false;
      });
  }

  create() {
    if (!this.newItem.name.trim() || this.saving) return;
    this.saving = true;
    this.catalogService
      .createCategory({
        name: this.newItem.name.trim(),
        description: this.newItem.description.trim() || undefined,
      })
      .subscribe({
        next: () => {
          this.newItem = { name: '', description: '' };
          this.saving = false;
          this.load();
        },
        error: () => {
          this.saving = false;
          alert('Error al crear categoría');
        },
      });
  }

  deleteItem(item: CategoryDTO) {
    if (!confirm(`¿Eliminar la categoría "${item.name}"?`)) return;
    this.catalogService.deleteCategory(item.id).subscribe({
      next: () => this.load(),
      error: () => alert('Error al eliminar categoría'),
    });
  }
}

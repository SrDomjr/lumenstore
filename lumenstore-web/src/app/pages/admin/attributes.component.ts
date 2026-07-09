import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { CatalogAdminService, ColorDTO, SizeDTO } from '../../services/catalog-admin.service';

@Component({
  selector: 'app-admin-attributes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-panel">
        <div class="header-panel">
          <div>
            <span class="eyebrow">Catálogo</span>
            <h1>Atributos (Color / Talla)</h1>
          </div>
        </div>

        <div class="two-col-layout">
          <!-- Left: Colors -->
          <div class="col-form">
            <div class="form-card">
              <h3 class="form-title">Nuevo color</h3>
              <div class="form-group">
                <label>Nombre *</label>
                <input
                  class="form-control"
                  [(ngModel)]="newColor.name"
                  placeholder="Ej: Negro"
                  (keydown.enter)="createColor()"
                />
              </div>
              <div class="form-group">
                <label>Color HEX</label>
                <div class="color-input-row">
                  <input
                    class="form-control color-hex-input"
                    [(ngModel)]="newColor.hexCode"
                    placeholder="#000000"
                    maxlength="7"
                  />
                  <input type="color" class="color-picker" [(ngModel)]="newColor.hexCode" />
                </div>
              </div>
              <button
                class="btn btn-primary"
                (click)="createColor()"
                [disabled]="!newColor.name.trim() || savingColor"
              >
                {{ savingColor ? 'Guardando...' : 'Crear color' }}
              </button>
            </div>

            <div class="form-card" style="margin-top: 24px;">
              <h3 class="form-title">Nueva talla</h3>
              <div class="form-group">
                <label>Nombre *</label>
                <input
                  class="form-control"
                  [(ngModel)]="newSize.name"
                  placeholder="Ej: S, M, L, XL"
                  (keydown.enter)="createSize()"
                />
              </div>
              <button
                class="btn btn-primary"
                (click)="createSize()"
                [disabled]="!newSize.name.trim() || savingSize"
              >
                {{ savingSize ? 'Guardando...' : 'Crear talla' }}
              </button>
            </div>
          </div>

          <!-- Right: Tables -->
          <div class="col-table">
            <!-- Colors Table -->
            <div class="table-card" style="margin-bottom: 24px;">
              <h3 class="form-title">Colores registrados</h3>
              <div *ngIf="loadingColors" class="loading-state">Cargando colores...</div>
              <div *ngIf="colorsError" class="alert alert-danger">{{ colorsError }}</div>
              <div class="table-wrap" *ngIf="!loadingColors && colors.length > 0">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Color</th>
                      <th>Hex</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let c of colors">
                      <td class="cell-id">#{{ c.id }}</td>
                      <td>
                        <strong>{{ c.name }}</strong>
                      </td>
                      <td>
                        <span class="color-swatch" [style.background]="c.hexCode || '#000'"></span>
                      </td>
                      <td class="cell-slug">{{ c.hexCode }}</td>
                      <td class="cell-actions">
                        <button class="action-link text-danger" (click)="deleteColor(c)">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div *ngIf="!loadingColors && colors.length === 0" class="empty-state">
                <p>No hay colores registrados.</p>
              </div>
            </div>

            <!-- Sizes Table -->
            <div class="table-card">
              <h3 class="form-title">Tallas registradas</h3>
              <div *ngIf="loadingSizes" class="loading-state">Cargando tallas...</div>
              <div *ngIf="sizesError" class="alert alert-danger">{{ sizesError }}</div>
              <div class="table-wrap" *ngIf="!loadingSizes && sizes.length > 0">
                <table class="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let s of sizes">
                      <td class="cell-id">#{{ s.id }}</td>
                      <td>
                        <strong>{{ s.name }}</strong>
                      </td>
                      <td class="cell-actions">
                        <button class="action-link text-danger" (click)="deleteSize(s)">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div *ngIf="!loadingSizes && sizes.length === 0" class="empty-state">
                <p>No hay tallas registradas.</p>
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
        box-sizing: border-box;
      }
      .form-control:focus {
        border-color: #111;
      }
      .form-control::placeholder {
        color: #bbb;
      }
      .color-input-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .color-hex-input {
        flex: 1;
      }
      .color-picker {
        width: 44px;
        height: 44px;
        border: 1px solid #e5e5e5;
        padding: 2px;
        cursor: pointer;
        background: none;
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
        padding: 12px 16px;
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
      .color-swatch {
        display: inline-block;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 1px solid #e5e5e5;
        vertical-align: middle;
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
export class AdminAttributesComponent implements OnInit {
  colors: ColorDTO[] = [];
  sizes: SizeDTO[] = [];
  loadingColors = true;
  loadingSizes = true;
  colorsError: string | null = null;
  sizesError: string | null = null;
  savingColor = false;
  savingSize = false;
  newColor = { name: '', hexCode: '#000000' };
  newSize = { name: '' };

  constructor(private catalogService: CatalogAdminService) {}

  ngOnInit() {
    this.loadColors();
    this.loadSizes();
  }

  loadColors() {
    this.loadingColors = true;
    this.catalogService
      .getColors()
      .pipe(
        catchError(() => {
          this.colorsError = 'Error al cargar colores';
          this.loadingColors = false;
          return of([]);
        }),
      )
      .subscribe((items) => {
        this.colors = items;
        this.loadingColors = false;
      });
  }

  loadSizes() {
    this.loadingSizes = true;
    this.catalogService
      .getSizes()
      .pipe(
        catchError(() => {
          this.sizesError = 'Error al cargar tallas';
          this.loadingSizes = false;
          return of([]);
        }),
      )
      .subscribe((items) => {
        this.sizes = items;
        this.loadingSizes = false;
      });
  }

  createColor() {
    if (!this.newColor.name.trim() || this.savingColor) return;
    this.savingColor = true;
    this.catalogService
      .createColor({
        name: this.newColor.name.trim(),
        hexCode: this.newColor.hexCode || '#000000',
      })
      .subscribe({
        next: () => {
          this.newColor = { name: '', hexCode: '#000000' };
          this.savingColor = false;
          this.loadColors();
        },
        error: () => {
          this.savingColor = false;
          alert('Error al crear color');
        },
      });
  }

  createSize() {
    if (!this.newSize.name.trim() || this.savingSize) return;
    this.savingSize = true;
    this.catalogService
      .createSize({
        name: this.newSize.name.trim(),
      })
      .subscribe({
        next: () => {
          this.newSize = { name: '' };
          this.savingSize = false;
          this.loadSizes();
        },
        error: () => {
          this.savingSize = false;
          alert('Error al crear talla');
        },
      });
  }

  deleteColor(item: ColorDTO) {
    if (!confirm(`¿Eliminar el color "${item.name}"?`)) return;
    this.catalogService.deleteColor(item.id).subscribe({
      next: () => this.loadColors(),
      error: () => alert('Error al eliminar color'),
    });
  }

  deleteSize(item: SizeDTO) {
    if (!confirm(`¿Eliminar la talla "${item.name}"?`)) return;
    this.catalogService.deleteSize(item.id).subscribe({
      next: () => this.loadSizes(),
      error: () => alert('Error al eliminar talla'),
    });
  }
}

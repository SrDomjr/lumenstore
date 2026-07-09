import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CatalogAdminService,
  BrandDTO,
  CategoryDTO,
  ColorDTO,
  SizeDTO,
} from '../../services/catalog-admin.service';

export type QuickCreateType = 'brand' | 'category' | 'color' | 'size';

@Component({
  selector: 'app-quick-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="qcc-overlay" *ngIf="visible" (click)="cancel()">
      <div class="qcc-modal" (click)="$event.stopPropagation()">
        <div class="qcc-header">
          <h3 class="qcc-title">{{ getTitle() }}</h3>
          <button class="qcc-close" (click)="cancel()">×</button>
        </div>
        <div class="qcc-body">
          <div class="form-group">
            <label>{{ getLabel() }}</label>
            <input
              class="form-control"
              [(ngModel)]="nameValue"
              placeholder="{{ getPlaceholder() }}"
              (keydown.enter)="save()"
              autofocus
            />
          </div>
          <div class="form-group" *ngIf="type === 'color'">
            <label>Color HEX</label>
            <div class="color-row">
              <input
                class="form-control"
                [(ngModel)]="hexValue"
                placeholder="#000000"
                maxlength="7"
              />
              <input type="color" class="color-picker" [(ngModel)]="hexValue" />
            </div>
          </div>
        </div>
        <div class="qcc-footer">
          <button class="qcc-btn qcc-btn-cancel" (click)="cancel()">Cancelar</button>
          <button
            class="qcc-btn qcc-btn-save"
            (click)="save()"
            [disabled]="!nameValue.trim() || saving"
          >
            {{ saving ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .qcc-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
      }
      .qcc-modal {
        background: #fff;
        padding: 28px 32px;
        width: 400px;
        max-width: 90%;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }
      .qcc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .qcc-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #111;
      }
      .qcc-close {
        background: none;
        border: none;
        font-size: 1.4rem;
        color: #999;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }
      .qcc-close:hover {
        color: #111;
      }
      .qcc-body {
        margin-bottom: 24px;
      }
      .form-group {
        margin-bottom: 16px;
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
      .color-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .color-picker {
        width: 44px;
        height: 44px;
        border: 1px solid #e5e5e5;
        padding: 2px;
        cursor: pointer;
        background: none;
      }
      .qcc-footer {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .qcc-btn {
        padding: 10px 24px;
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid #e5e5e5;
        background: transparent;
      }
      .qcc-btn-cancel {
        color: #767676;
      }
      .qcc-btn-cancel:hover {
        border-color: #ccc;
        color: #111;
      }
      .qcc-btn-save {
        background: #111;
        border-color: #111;
        color: #fff;
      }
      .qcc-btn-save:hover:not(:disabled) {
        background: #333;
        border-color: #333;
      }
      .qcc-btn-save:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    `,
  ],
})
export class QuickCreateModalComponent {
  @Input() visible = false;
  @Input() type: QuickCreateType = 'brand';
  @Output() created = new EventEmitter<BrandDTO | CategoryDTO | ColorDTO | SizeDTO>();
  @Output() cancelled = new EventEmitter<void>();

  nameValue = '';
  hexValue = '#000000';
  saving = false;

  constructor(private catalogService: CatalogAdminService) {}

  reset() {
    this.nameValue = '';
    this.hexValue = '#000000';
    this.saving = false;
  }

  getTitle(): string {
    switch (this.type) {
      case 'brand':
        return 'Nueva marca';
      case 'category':
        return 'Nueva categoría';
      case 'color':
        return 'Nuevo color';
      case 'size':
        return 'Nueva talla';
    }
  }

  getLabel(): string {
    switch (this.type) {
      case 'brand':
        return 'Nombre de la marca *';
      case 'category':
        return 'Nombre de la categoría *';
      case 'color':
        return 'Nombre del color *';
      case 'size':
        return 'Nombre de la talla *';
    }
  }

  getPlaceholder(): string {
    switch (this.type) {
      case 'brand':
        return 'Ej: Nike';
      case 'category':
        return 'Ej: Electrónicos';
      case 'color':
        return 'Ej: Negro';
      case 'size':
        return 'Ej: M';
    }
  }

  save() {
    if (!this.nameValue.trim() || this.saving) return;
    this.saving = true;

    switch (this.type) {
      case 'brand':
        this.catalogService.quickCreateBrand(this.nameValue.trim()).subscribe({
          next: (result) => {
            this.saving = false;
            this.created.emit(result);
          },
          error: () => {
            this.saving = false;
            alert('Error al crear marca');
          },
        });
        break;
      case 'category':
        this.catalogService.quickCreateCategory(this.nameValue.trim()).subscribe({
          next: (result) => {
            this.saving = false;
            this.created.emit(result);
          },
          error: () => {
            this.saving = false;
            alert('Error al crear categoría');
          },
        });
        break;
      case 'color':
        this.catalogService.quickCreateColor(this.nameValue.trim(), this.hexValue).subscribe({
          next: (result) => {
            this.saving = false;
            this.created.emit(result);
          },
          error: () => {
            this.saving = false;
            alert('Error al crear color');
          },
        });
        break;
      case 'size':
        this.catalogService.quickCreateSize(this.nameValue.trim()).subscribe({
          next: (result) => {
            this.saving = false;
            this.created.emit(result);
          },
          error: () => {
            this.saving = false;
            alert('Error al crear talla');
          },
        });
        break;
    }
  }

  cancel() {
    this.cancelled.emit();
  }
}

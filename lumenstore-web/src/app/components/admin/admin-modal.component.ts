import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="open" class="admin-modal-overlay" (click)="onOverlayClick($event)">
      <div class="admin-modal" [class]="'admin-modal admin-modal--' + size" (click)="$event.stopPropagation()">
        <div class="admin-modal__header">
          <h3>{{ title }}</h3>
          <button class="admin-modal__close" (click)="close.emit()" aria-label="Cerrar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="admin-modal__body">
          <ng-content></ng-content>
        </div>
        <div *ngIf="hasFooter" class="admin-modal__footer">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class AdminModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() hasFooter = true;
  @Input() closeOnOverlay = true;

  @Output() close = new EventEmitter<void>();

  onOverlayClick(event: Event): void {
    if (this.closeOnOverlay) {
      this.close.emit();
    }
  }
}

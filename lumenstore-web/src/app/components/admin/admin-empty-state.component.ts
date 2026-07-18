import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-empty">
      <i *ngIf="icon" [class]="icon + ' admin-empty__icon'"></i>
      <h3 class="admin-empty__title">{{ title }}</h3>
      <p class="admin-empty__message">{{ message }}</p>
      <ng-content></ng-content>
    </div>
  `,
})
export class AdminEmptyStateComponent {
  @Input() title = 'Sin resultados';
  @Input() message = '';
  @Input() icon = 'fa-regular fa-folder-open';
}

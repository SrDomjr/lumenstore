import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="skeletonClass" [style.width]="width" [style.height]="height"></div>
  `,
})
export class AdminSkeletonComponent {
  @Input() type: 'line' | 'circle' | 'row' | 'card' = 'line';
  @Input() width = '';
  @Input() height = '';

  get skeletonClass(): string {
    return `admin-skeleton admin-skeleton--${this.type}`;
  }
}

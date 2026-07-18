import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="cardClass">
      <ng-content></ng-content>
    </div>
  `,
})
export class AdminCardComponent {
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';

  get cardClass(): string {
    return `admin-card admin-card--${this.padding}`;
  }
}

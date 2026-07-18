import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="badgeClass">
      <ng-content></ng-content>
      {{ label }}
    </span>
  `,
})
export class AdminBadgeComponent {
  @Input() variant:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'paid'
    | 'delivered'
    | 'cancelled'
    | 'inactive'
    | 'refunded'
    | 'info'
    | 'shipped'
    | 'active'
    | 'neutral'
    | 'success'
    | 'danger'
    | 'warning' = 'neutral';
  @Input() label = '';

  get badgeClass(): string {
    const variantMap: Record<string, string> = {
      pending: 'pending',
      processing: 'processing',
      completed: 'completed',
      paid: 'completed',
      delivered: 'completed',
      active: 'active',
      success: 'completed',
      cancelled: 'cancelled',
      inactive: 'inactive',
      refunded: 'cancelled',
      danger: 'cancelled',
      info: 'info',
      shipped: 'info',
      warning: 'processing',
      neutral: 'neutral',
    };
    return `admin-badge ${variantMap[this.variant] || 'neutral'}`;
  }
}

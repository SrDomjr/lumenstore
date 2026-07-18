import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface BreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-admin-page-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav *ngIf="breadcrumb && breadcrumb.length" class="admin-breadcrumb">
      <ng-container *ngFor="let item of breadcrumb; let last = last">
        <a *ngIf="item.link" [routerLink]="item.link">{{ item.label }}</a>
        <span *ngIf="!item.link && !last" class="separator">/</span>
        <span *ngIf="!item.link && last" class="current">{{ item.label }}</span>
        <span *ngIf="item.link && !last" class="separator">/</span>
      </ng-container>
    </nav>

    <div class="admin-page-header">
      <div class="admin-page-header__left">
        <h1 class="admin-page-title">{{ title }}</h1>
        <p *ngIf="subtitle" class="admin-text-muted" style="margin: 0; font-size: var(--admin-font-size-base);">
          {{ subtitle }}
        </p>
      </div>
      <div class="admin-page-header__actions">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class AdminPageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() breadcrumb: BreadcrumbItem[] = [];
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-catalog-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="catalog-layout" [class.sidebar-collapsed]="collapsed">
      <aside class="catalog-sidebar" [class.collapsed]="collapsed">
        <div class="sidebar-header">
          <span class="eyebrow">LumenStore</span>
          <h2>Admin</h2>
          <button class="collapse-btn" (click)="collapsed = !collapsed" title="Colapsar menú">
            {{ collapsed ? '→' : '←' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          <!-- Dashboard -->
          <a
            class="nav-item"
            routerLink="/admin/dashboard"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
          >
            <i class="fa-solid fa-chart-line nav-icon"></i>
            <span class="nav-label">Dashboard</span>
          </a>

          <!-- Catálogo (accordion) -->
          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('catalog')">
              <i class="fa-solid fa-boxes-stacked nav-icon"></i>
              <span class="nav-label">Catálogo</span>
              <span class="section-arrow">{{ expandedSections['catalog'] ? '▾' : '▸' }}</span>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['catalog']">
              <a
                class="sub-item"
                routerLink="/admin/catalog/products"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                <span class="nav-label">Productos</span>
              </a>
              <a class="sub-item" routerLink="/admin/catalog/categories" routerLinkActive="active">
                <span class="nav-label">Categorías</span>
              </a>
              <a class="sub-item" routerLink="/admin/catalog/brands" routerLinkActive="active">
                <span class="nav-label">Marcas</span>
              </a>
              <a class="sub-item" routerLink="/admin/catalog/attributes" routerLinkActive="active">
                <span class="nav-label">Atributos</span>
              </a>
            </div>
          </div>

          <!-- Ventas (accordion) -->
          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('ventas')">
              <i class="fa-solid fa-receipt nav-icon"></i>
              <span class="nav-label">Ventas</span>
              <span class="section-arrow">{{ expandedSections['ventas'] ? '▾' : '▸' }}</span>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['ventas']">
              <a class="sub-item" routerLink="/admin/orders" routerLinkActive="active">
                <span class="nav-label">Pedidos</span>
              </a>
              <a class="sub-item" routerLink="/admin/orders" routerLinkActive="active">
                <span class="nav-label">Comprobantes</span>
              </a>
            </div>
          </div>

          <!-- Usuarios (accordion) -->
          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('usuarios')">
              <i class="fa-solid fa-users nav-icon"></i>
              <span class="nav-label">Usuarios</span>
              <span class="section-arrow">{{ expandedSections['usuarios'] ? '▾' : '▸' }}</span>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['usuarios']">
              <a class="sub-item" routerLink="/admin/users" routerLinkActive="active">
                <span class="nav-label">Clientes</span>
              </a>
            </div>
          </div>

          <!-- Marketing (accordion) -->
          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('marketing')">
              <i class="fa-solid fa-percent nav-icon"></i>
              <span class="nav-label">Marketing</span>
              <span class="section-arrow">{{ expandedSections['marketing'] ? '▾' : '▸' }}</span>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['marketing']">
              <a class="sub-item" routerLink="/admin" routerLinkActive="active">
                <span class="nav-label">Cupones</span>
              </a>
              <a class="sub-item" routerLink="/admin" routerLinkActive="active">
                <span class="nav-label">Banners</span>
              </a>
            </div>
          </div>
        </nav>
      </aside>
      <main class="catalog-content" [class.collapsed]="collapsed">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .catalog-layout {
        display: flex;
        align-items: flex-start;
        min-height: calc(100vh - var(--header-height, 60px));
        background: #fafafa;
      }

      /* ─── Sidebar (sticky) ─────────────────────────────── */
      .catalog-sidebar {
        position: sticky;
        top: var(--header-height, 60px);
        left: 0;
        width: 240px;
        min-width: 240px;
        height: calc(100vh - var(--header-height, 60px));
        background: #fff;
        border-right: 1px solid #e5e5e5;
        display: flex;
        flex-direction: column;
        padding: 0;
        z-index: 100;
        transition:
          width 0.25s ease,
          min-width 0.25s ease;

        &.collapsed {
          width: 60px;
          min-width: 60px;
        }
      }

      .sidebar-header {
        padding: 24px 20px 20px;
        border-bottom: 1px solid #e5e5e5;
        display: flex;
        flex-direction: column;
        position: relative;

        .eyebrow {
          font-size: 0.55rem;
          font-weight: 500;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #999;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
        }

        h2 {
          margin: 0;
          font-size: 1rem;
          font-weight: 300;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: #111;
          white-space: nowrap;
          overflow: hidden;
        }

        .collapse-btn {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: 1px solid #e5e5e5;
          width: 24px;
          height: 24px;
          font-size: 0.7rem;
          color: #999;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          border-radius: 3px;

          &:hover {
            border-color: #111;
            color: #111;
          }
        }
      }

      .sidebar-nav {
        display: flex;
        flex-direction: column;
        padding: 8px 0;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }

      /* ─── Nav Items ──────────────────────────────────── */
      .nav-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #777;
        text-decoration: none;
        transition: all 0.15s ease;
        white-space: nowrap;
        position: relative;

        &:hover {
          color: #000;
          background: #f8f8f8;
        }

        &.active {
          color: #000;
          font-weight: 500;

          &::before {
            content: '';
            position: absolute;
            left: 6px;
            top: 6px;
            bottom: 6px;
            width: 2px;
            background: #000;
          }
        }

        .nav-icon {
          font-size: 0.9rem;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
          opacity: 0.5;
          color: #888;
          transition: all 0.15s ease;
        }

        &:hover .nav-icon {
          opacity: 0.9;
          color: #000;
        }

        &.active .nav-icon {
          opacity: 1;
          color: #000;
        }
      }

      /* ─── Accordion Sections ─────────────────────────── */
      .nav-section {
        display: flex;
        flex-direction: column;
      }

      .section-toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 20px;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #777;
        background: none;
        border: none;
        cursor: pointer;
        transition: all 0.15s ease;
        width: 100%;
        text-align: left;
        font-family: inherit;

        &:hover {
          color: #000;
          background: #f8f8f8;
        }

        .nav-icon {
          font-size: 0.9rem;
          width: 20px;
          text-align: center;
          flex-shrink: 0;
          opacity: 0.5;
          color: #888;
          transition: all 0.15s ease;
        }

        &:hover .nav-icon {
          opacity: 0.9;
          color: #000;
        }

        .nav-label {
          flex: 1;
        }

        .section-arrow {
          font-size: 0.6rem;
          opacity: 0.5;
          transition: transform 0.2s ease;
        }
      }

      .sub-nav {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;

        &.expanded {
          max-height: 300px;
        }
      }

      .sub-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 20px 8px 50px;
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #777;
        text-decoration: none;
        transition: all 0.15s ease;
        white-space: nowrap;
        position: relative;

        &:hover {
          color: #000;
          background: #f8f8f8;
        }

        &.active {
          color: #000;
          font-weight: 500;

          &::before {
            content: '';
            position: absolute;
            left: 6px;
            top: 4px;
            bottom: 4px;
            width: 2px;
            background: #000;
          }
        }

        .sub-indicator {
          display: none;
        }
      }

      /* ─── Content ────────────────────────────────────── */
      .catalog-content {
        flex: 1;
        min-width: 0;
        padding-top: 48px; /* Aire premium debajo del navbar */
      }

      /* ─── Collapsed state overrides ──────────────────── */
      .catalog-sidebar.collapsed {
        .nav-label,
        .section-arrow,
        .sub-nav,
        .back-link span:not(.back-arrow),
        .eyebrow,
        h2 {
          display: none;
        }

        .sidebar-header {
          padding: 24px 12px 20px;
          align-items: center;
        }

        .collapse-btn {
          position: static;
          transform: none;
        }

        .nav-item,
        .section-toggle {
          padding: 10px 12px;
          justify-content: center;
        }

        .nav-icon {
          margin: 0;
        }
      }

      @media (max-width: 768px) {
        .catalog-sidebar {
          width: 60px;
          min-width: 60px;

          .nav-label,
          .section-arrow,
          .sub-nav,
          .back-link span:not(.back-arrow),
          .eyebrow,
          h2 {
            display: none;
          }

          .sidebar-header {
            padding: 24px 12px 20px;
            align-items: center;
          }

          .collapse-btn {
            position: static;
            transform: none;
          }

          .nav-item,
          .section-toggle {
            padding: 10px 12px;
            justify-content: center;
          }

          .nav-icon {
            margin: 0;
          }
        }
      }
    `,
  ],
})
export class AdminCatalogLayoutComponent {
  collapsed = false;

  expandedSections: Record<string, boolean> = {
    catalog: true,
    ventas: false,
    usuarios: false,
    marketing: false,
  };

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }
}

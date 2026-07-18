import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-catalog-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout" [class.sidebar-collapsed]="collapsed" [class.sidebar-open-mobile]="mobileOpen">
      <div class="sidebar-scrim" *ngIf="mobileOpen" (click)="mobileOpen = false"></div>

      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <a class="brand" routerLink="/admin/dashboard">
            <span class="brand-mark">L</span>
            <span class="brand-text" *ngIf="!collapsed">
              <span class="store-name">LUMENSTORE</span>
              <span class="badge">Admin</span>
            </span>
          </a>
          <button class="collapse-btn" (click)="collapsed = !collapsed" [title]="collapsed ? 'Expandir menú' : 'Colapsar menú'">
            <i class="fa-solid" [class.fa-angles-right]="collapsed" [class.fa-angles-left]="!collapsed"></i>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a class="nav-item" routerLink="/admin/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" [title]="collapsed ? 'Inicio' : ''">
            <i class="fa-solid fa-house nav-icon"></i>
            <span class="nav-label" *ngIf="!collapsed">Inicio</span>
          </a>

          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('ventas')" [title]="collapsed ? 'Pedidos' : ''">
              <i class="fa-solid fa-bag-shopping nav-icon"></i>
              <span class="nav-label" *ngIf="!collapsed">Pedidos</span>
              <i class="fa-solid fa-chevron-down section-arrow" *ngIf="!collapsed" [class.rotated]="expandedSections['ventas']"></i>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['ventas'] && !collapsed">
              <a class="sub-item" routerLink="/admin/sales" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
                <span class="nav-label">Todos los pedidos</span>
              </a>
            </div>
          </div>

          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('catalog')" [title]="collapsed ? 'Catálogo' : ''">
              <i class="fa-solid fa-tag nav-icon"></i>
              <span class="nav-label" *ngIf="!collapsed">Catálogo</span>
              <i class="fa-solid fa-chevron-down section-arrow" *ngIf="!collapsed" [class.rotated]="expandedSections['catalog']"></i>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['catalog'] && !collapsed">
              <a class="sub-item" routerLink="/admin/catalog/products" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
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

          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('inventario')" [title]="collapsed ? 'Inventario' : ''">
              <i class="fa-solid fa-boxes-stacked nav-icon"></i>
              <span class="nav-label" *ngIf="!collapsed">Inventario</span>
              <i class="fa-solid fa-chevron-down section-arrow" *ngIf="!collapsed" [class.rotated]="expandedSections['inventario']"></i>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['inventario'] && !collapsed">
              <a class="sub-item" routerLink="/admin/inventory" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
                <span class="nav-label">Stock</span>
              </a>
              <a class="sub-item" routerLink="/admin/inventory/kardex" routerLinkActive="active">
                <span class="nav-label">Kardex</span>
              </a>
            </div>
          </div>

          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('marketing')" [title]="collapsed ? 'Marketing' : ''">
              <i class="fa-solid fa-bullhorn nav-icon"></i>
              <span class="nav-label" *ngIf="!collapsed">Marketing</span>
              <i class="fa-solid fa-chevron-down section-arrow" *ngIf="!collapsed" [class.rotated]="expandedSections['marketing']"></i>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['marketing'] && !collapsed">
              <a class="sub-item" routerLink="/admin/marketing/discounts" routerLinkActive="active">
                <span class="nav-label">Descuentos</span>
              </a>
              <a class="sub-item" routerLink="/admin/marketing/coupons" routerLinkActive="active">
                <span class="nav-label">Cupones</span>
              </a>
              <a class="sub-item" routerLink="/admin/marketing/banners" routerLinkActive="active">
                <span class="nav-label">Banners</span>
              </a>
            </div>
          </div>

          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('clientes')" [title]="collapsed ? 'Clientes' : ''">
              <i class="fa-solid fa-users nav-icon"></i>
              <span class="nav-label" *ngIf="!collapsed">Clientes</span>
              <i class="fa-solid fa-chevron-down section-arrow" *ngIf="!collapsed" [class.rotated]="expandedSections['clientes']"></i>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['clientes'] && !collapsed">
              <a class="sub-item" routerLink="/admin/customers" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
                <span class="nav-label">Todos</span>
              </a>
              <a class="sub-item" routerLink="/admin/reviews" routerLinkActive="active">
                <span class="nav-label">Reseñas</span>
              </a>
              <a class="sub-item" routerLink="/admin/questions" routerLinkActive="active">
                <span class="nav-label">Preguntas</span>
              </a>
            </div>
          </div>

          <div class="nav-section">
            <button class="section-toggle" (click)="toggleSection('seguridad')" [title]="collapsed ? 'Seguridad' : ''">
              <i class="fa-solid fa-shield-halved nav-icon"></i>
              <span class="nav-label" *ngIf="!collapsed">Seguridad</span>
              <i class="fa-solid fa-chevron-down section-arrow" *ngIf="!collapsed" [class.rotated]="expandedSections['seguridad']"></i>
            </button>
            <div class="sub-nav" [class.expanded]="expandedSections['seguridad'] && !collapsed">
              <a class="sub-item" routerLink="/admin/security/users" routerLinkActive="active">
                <span class="nav-label">Usuarios</span>
              </a>
              <a class="sub-item" routerLink="/admin/security/roles" routerLinkActive="active">
                <span class="nav-label">Roles</span>
              </a>
              <a class="sub-item" routerLink="/admin/security/audit-logs" routerLinkActive="active">
                <span class="nav-label">Auditoría</span>
              </a>
              <a class="sub-item" routerLink="/admin/security/login-history" routerLinkActive="active">
                <span class="nav-label">Accesos</span>
              </a>
            </div>
          </div>

          <a class="nav-item" routerLink="/admin/settings" routerLinkActive="active" [title]="collapsed ? 'Configuración' : ''">
            <i class="fa-solid fa-gear nav-icon"></i>
            <span class="nav-label" *ngIf="!collapsed">Configuración</span>
          </a>

          <div class="nav-spacer"></div>

          <a class="nav-item back-link" routerLink="/store" [title]="collapsed ? 'Volver a la tienda' : ''">
            <i class="fa-solid fa-arrow-up-right-from-square nav-icon"></i>
            <span class="nav-label" *ngIf="!collapsed">Volver a la tienda</span>
          </a>
        </nav>
      </aside>

      <main class="admin-main">
        <header class="admin-topbar">
          <button class="mobile-menu-btn" (click)="mobileOpen = !mobileOpen" aria-label="Abrir menú">
            <i class="fa-solid fa-bars"></i>
          </button>

          <div class="search-bar">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input type="text" placeholder="Buscar productos, pedidos, clientes…" class="search-input" />
          </div>

          <div class="topbar-actions">
            <button class="action-btn notifications" aria-label="Notificaciones">
              <i class="fa-regular fa-bell"></i>
            </button>
            <div class="profile-dropdown" tabindex="0">
              <button class="profile-trigger" aria-haspopup="true" aria-expanded="false">
                <span class="avatar">{{ userInitial }}</span>
                <span class="profile-info">
                  <span class="profile-name">{{ userName }}</span>
                  <span class="profile-role">Administrador</span>
                </span>
                <i class="fa-solid fa-caret-down caret"></i>
              </button>
              <ul class="dropdown-menu" role="menu">
                <li role="none"><a role="menuitem" routerLink="/profile">Mi perfil</a></li>
                <li role="none"><a role="menuitem" routerLink="/store">Volver a la tienda</a></li>
                <li class="divider" role="separator"></li>
                <li role="none">
                  <button role="menuitem" (click)="onLogout()">Cerrar sesión</button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        <div class="admin-content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        --sidebar-width: 248px;
        --sidebar-width-collapsed: 68px;
        --topbar-height: 64px;
        --accent: #111111;
      }

      .admin-layout {
        display: flex;
        min-height: 100vh;
        background-color: var(--admin-bg);
      }

      .sidebar-scrim {
        display: none;
      }

      /* ─── Sidebar ─────────────────────────────── */
      .admin-sidebar {
        width: var(--sidebar-width);
        background: #111111;
        display: flex;
        flex-direction: column;
        transition: width 0.25s cubic-bezier(0.2, 0, 0, 1);
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        z-index: 110;

        .sidebar-collapsed & {
          width: var(--sidebar-width-collapsed);
        }
      }

      .sidebar-header {
        height: var(--topbar-height);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 14px 0 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        flex-shrink: 0;

        .sidebar-collapsed & {
          padding: 0;
          justify-content: center;
        }
      }

      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        overflow: hidden;
        text-decoration: none;

        &:hover {
          opacity: 1;
          text-decoration: none;
        }

        .sidebar-collapsed & {
          justify-content: center;
        }
      }

      .brand-mark {
        width: 30px;
        height: 30px;
        flex-shrink: 0;
        background: #ffffff;
        color: #111;
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.95rem;
      }

      .brand-text {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
      }

      .store-name {
        font-weight: 700;
        font-size: 0.8rem;
        letter-spacing: 0.14em;
        color: #ffffff;
      }

      .badge {
        font-size: 0.65rem;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.45);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .collapse-btn {
        background: transparent;
        border: none;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.5);
        border-radius: 4px;
        transition: background 0.15s ease, color 0.15s ease;
        flex-shrink: 0;

        &:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }

        .sidebar-collapsed & {
          display: none;
        }
      }

      .sidebar-nav {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        padding: 16px 10px;
        display: flex;
        flex-direction: column;
        gap: 2px;

        &::-webkit-scrollbar {
          width: 4px;
        }
      }

      .nav-spacer {
        flex: 1;
        min-height: 16px;
      }

      .nav-item,
      .section-toggle {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 9px 12px;
        border-radius: 3px;
        color: rgba(255, 255, 255, 0.62);
        text-decoration: none;
        transition: background 0.12s ease, color 0.12s ease;
        cursor: pointer;
        background: transparent;
        border: none;
        width: 100%;
        font-family: inherit;
        font-size: 0.83rem;
        font-weight: 500;
        position: relative;

        .sidebar-collapsed & {
          justify-content: center;
          padding: 11px;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.06);
          color: #fff;
          text-decoration: none;
        }

        &.active,
        &.active-section {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          font-weight: 600;

          &::before {
            content: '';
            position: absolute;
            left: -10px;
            top: 8px;
            bottom: 8px;
            width: 3px;
            background: var(--accent);
            border-radius: 0 2px 2px 0;

            .sidebar-collapsed & {
              display: none;
            }
          }
        }

        .nav-icon {
          font-size: 1rem;
          width: 18px;
          text-align: center;
          flex-shrink: 0;
        }

        .nav-label {
          flex: 1;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .section-arrow {
          font-size: 0.65rem;
          transition: transform 0.2s ease;
          opacity: 0.45;
          &.rotated {
            transform: rotate(180deg);
          }
        }
      }

      .back-link {
        color: rgba(255, 255, 255, 0.45);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        margin-top: 8px;
        padding-top: 14px;
        border-radius: 0;
      }

      .sub-nav {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        max-height: 0;
        opacity: 0;
        transition: max-height 0.25s ease, opacity 0.2s ease;
        padding-left: 34px;

        &.expanded {
          max-height: 400px;
          opacity: 1;
          margin-top: 2px;
          margin-bottom: 6px;
        }

        .sub-item {
          display: block;
          padding: 7px 12px;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.5);
          text-decoration: none;
          border-radius: 3px;
          transition: all 0.12s ease;
          white-space: nowrap;

          &:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.06);
            text-decoration: none;
          }

          &.active {
            color: #ffffff;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.08);
          }
        }
      }

      /* ─── Main Content ───────────────────────────────── */
      .admin-main {
        flex: 1;
        margin-left: var(--sidebar-width);
        display: flex;
        flex-direction: column;
        min-width: 0;
        transition: margin-left 0.25s cubic-bezier(0.2, 0, 0, 1);

        .sidebar-collapsed & {
          margin-left: var(--sidebar-width-collapsed);
        }
      }

      .admin-topbar {
        height: var(--topbar-height);
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 32px;
        position: sticky;
        top: 0;
        z-index: 90;
        background: rgba(245, 245, 243, 0.9);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--admin-border);
      }

      .mobile-menu-btn {
        display: none;
        background: transparent;
        border: none;
        color: var(--admin-text-main);
        font-size: 1.1rem;
        cursor: pointer;
        width: 32px;
        height: 32px;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .search-bar {
        position: relative;
        width: 100%;
        max-width: 420px;

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--admin-text-muted);
          font-size: 0.85rem;
        }

        .search-input {
          width: 100%;
          padding: 9px 12px 9px 36px;
          border-radius: 3px;
          border: 1px solid var(--admin-border);
          background: var(--admin-surface);
          font-size: 0.85rem;
          color: var(--admin-text-main);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;

          &::placeholder {
            color: var(--admin-text-muted);
          }

          &:focus {
            outline: none;
            border-color: #111;
            box-shadow: 0 0 0 1px #111;
          }
        }
      }

      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;

        .action-btn {
          background: transparent;
          border: none;
          color: var(--admin-text-muted);
          font-size: 1.05rem;
          cursor: pointer;
          width: 34px;
          height: 34px;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &:hover {
            background: rgba(0, 0, 0, 0.05);
            color: var(--admin-text-main);
          }
        }
      }

      /* ─── Profile dropdown (topbar) ──────────────────── */
      .profile-dropdown {
        position: relative;
      }

      .profile-trigger {
        display: flex;
        align-items: center;
        gap: 10px;
        background: transparent;
        border: none;
        padding: 4px 8px 4px 4px;
        border-radius: 4px;
        cursor: pointer;
        transition: background 0.15s ease;

        &:hover {
          background: rgba(0, 0, 0, 0.04);
        }
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #111111;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 0.8rem;
        flex-shrink: 0;
      }

      .profile-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.2;

        @media (max-width: 640px) {
          display: none;
        }
      }

      .profile-name {
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--admin-text-main);
      }

      .profile-role {
        font-size: 0.68rem;
        color: var(--admin-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .caret {
        font-size: 0.65rem;
        color: var(--admin-text-muted);
      }

      .dropdown-menu {
        position: absolute;
        right: 0;
        top: calc(100% + 6px);
        background: #fff;
        border: 1px solid var(--admin-border);
        border-radius: 4px;
        box-shadow: var(--admin-shadow-modal);
        min-width: 190px;
        padding: 6px 0;
        list-style: none;
        display: none;
        z-index: 200;
        margin: 0;
      }

      .dropdown-menu li {
        padding: 0;
      }

      .dropdown-menu li a,
      .dropdown-menu li button {
        display: block;
        width: 100%;
        text-align: left;
        padding: 9px 16px;
        color: var(--admin-text-main);
        background: transparent;
        border: none;
        text-decoration: none;
        font-size: 0.85rem;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.12s ease;

        &:hover {
          background: #f5f5f5;
          text-decoration: none;
        }
      }

      .dropdown-menu .divider {
        height: 1px;
        background: var(--admin-border);
        margin: 6px 0;
      }

      .profile-dropdown:hover .dropdown-menu,
      .profile-dropdown:focus-within .dropdown-menu {
        display: block;
      }

      .admin-content-wrapper {
        padding: 28px 32px 56px;
        flex: 1;
        max-width: 1280px;
        width: 100%;
        margin: 0 auto;
      }

      @media (max-width: 900px) {
        .admin-sidebar {
          transform: translateX(-100%);
          width: var(--sidebar-width) !important;
          transition: transform 0.25s ease;
        }

        .sidebar-open-mobile .admin-sidebar {
          transform: translateX(0);
        }

        .sidebar-scrim {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 105;
        }

        .admin-main,
        .sidebar-collapsed .admin-main {
          margin-left: 0 !important;
        }

        .mobile-menu-btn {
          display: flex;
        }

        .admin-topbar {
          padding: 0 16px;
        }

        .admin-content-wrapper {
          padding: 20px 16px 40px;
        }
      }
    `,
  ],
})
export class AdminCatalogLayoutComponent {
  collapsed = false;
  mobileOpen = false;

  expandedSections: Record<string, boolean> = {
    catalog: false,
    ventas: false,
    inventario: false,
    marketing: false,
    clientes: false,
    seguridad: false,
  };

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  get userName(): string {
    const user = this.auth.getCurrentUser();
    if (!user) return 'Administrador';
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username || 'Administrador';
  }

  get userInitial(): string {
    const user = this.auth.getCurrentUser();
    const source = user?.firstName || user?.username || 'A';
    return source.charAt(0).toUpperCase();
  }

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  onLogout() {
    this.auth.logout();
    this.router.navigate(['/home']);
  }
}

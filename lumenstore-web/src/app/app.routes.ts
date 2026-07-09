import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
    pathMatch: 'full',
  },
  // Normalize URLs like '/.' to home
  {
    path: '.',
    redirectTo: 'home',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'home',
    redirectTo: '',
  },
  {
    path: 'products',
    redirectTo: 'store',
  },
  {
    path: 'store',
    loadComponent: () => import('./pages/store/store.component').then((m) => m.StoreComponent),
  },
  {
    path: 'store/:id',
    loadComponent: () =>
      import('./pages/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'wishlists',
    loadComponent: () =>
      import('./pages/wishlists/wishlists.component').then((m) => m.WishlistsComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'orders',
    loadComponent: () => import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./pages/order-detail/order-detail.component').then((m) => m.OrderDetailComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'addresses',
    loadComponent: () =>
      import('./pages/addresses/addresses.component').then((m) => m.AddressesComponent),
    canActivate: [AuthGuard],
  },
  // ─── Admin root: loads sidebar layout ──────────────────────
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/catalog-layout.component').then((m) => m.AdminCatalogLayoutComponent),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin/dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'catalog/products',
        loadComponent: () =>
          import('./pages/admin/products.component').then((m) => m.AdminProductsComponent),
      },
      {
        path: 'catalog/products/new',
        loadComponent: () =>
          import('./pages/admin/product-edit.component').then((m) => m.AdminProductEditComponent),
      },
      {
        path: 'catalog/products/:id/edit',
        loadComponent: () =>
          import('./pages/admin/product-edit.component').then((m) => m.AdminProductEditComponent),
      },
      {
        path: 'catalog/categories',
        loadComponent: () =>
          import('./pages/admin/categories.component').then((m) => m.AdminCategoriesComponent),
      },
      {
        path: 'catalog/brands',
        loadComponent: () =>
          import('./pages/admin/brands.component').then((m) => m.AdminBrandsComponent),
      },
      {
        path: 'catalog/attributes',
        loadComponent: () =>
          import('./pages/admin/attributes.component').then((m) => m.AdminAttributesComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/admin/orders.component').then((m) => m.AdminOrdersComponent),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./pages/admin/order-detail.component').then((m) => m.AdminOrderDetailComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin/users.component').then((m) => m.AdminUsersComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  // Legacy redirects
  {
    path: 'admin/products',
    redirectTo: 'admin/catalog/products',
  },
  {
    path: 'admin/products/new',
    redirectTo: 'admin/catalog/products/new',
  },
  {
    path: 'admin/products/:id/edit',
    redirectTo: 'admin/catalog/products/:id/edit',
  },
  {
    path: 'admin/orders/:id',
    redirectTo: 'admin/orders/:id',
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];

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
    loadComponent: () =>
      import('./pages/product-list/product-list.component').then((m) => m.ProductListComponent),
  },
  {
    path: 'store',
    loadComponent: () => import('./pages/store/store.component').then((m) => m.StoreComponent),
  },
  {
    path: 'products/:id',
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
  {
    path: 'admin',
    loadComponent: () =>
      import('./pages/admin/dashboard.component').then((m) => m.AdminDashboardComponent),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/products',
    loadComponent: () =>
      import('./pages/admin/products.component').then((m) => m.AdminProductsComponent),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/products/new',
    loadComponent: () =>
      import('./pages/admin/product-edit.component').then((m) => m.AdminProductEditComponent),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/products/:id/edit',
    loadComponent: () =>
      import('./pages/admin/product-edit.component').then((m) => m.AdminProductEditComponent),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/orders',
    loadComponent: () =>
      import('./pages/admin/orders.component').then((m) => m.AdminOrdersComponent),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/orders/:id',
    loadComponent: () =>
      import('./pages/admin/order-detail.component').then((m) => m.AdminOrderDetailComponent),
    canActivate: [RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];

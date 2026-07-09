// Auth Models
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  customerProfile: {
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string | null;
  };
}

export interface AuthResponse {
  id: number;
  token: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  refreshToken: string;
  roleId?: number;
  roles?: string[];
  authorities?: string[];
}

// User Models
export interface Usuario {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleId: number;
  createdAt: string;
}

export interface LoginHistory {
  id: number;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  createdAt: string;
}

// Customer Models
export interface Cliente {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  gender: string;
  createdAt: string;
}

export interface Direccion {
  id: number;
  clienteId: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'billing' | 'shipping' | 'both';
  isDefault: boolean;
  createdAt: string;
}

export interface DireccionRequestDTO {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'billing' | 'shipping' | 'both';
  isDefault: boolean;
}

export interface DireccionResponseDTO {
  id: number;
  clienteId: number;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
  isDefault: boolean;
  createdAt: string;
}

// Product Models
export interface Producto {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  brandName: string;
  categoryName: string;
  basePrice: number;
  stock: number;
  discount: number;
  featured: boolean;
  images: string[];
}

export interface ProductoResponseDTO {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  sku: string;
  brandName: string;
  categoryName: string;
  basePrice: number;
  stock: number;
  discount: number;
  featured: boolean;
  images: string[];
  isActive: boolean;
}

export interface ProductVariant {
  id: number;
  productId: number;
  tallaId: number;
  colorId: number;
  sku: string;
  price: number;
  stock: number;
  createdAt: string;
}

export interface ProductVariantResponseDTO {
  id: number;
  sku: string;
  sizeName: string;
  colorName: string;
  colorHex: string;
  price: number;
  compareAtPrice: number;
  stock: number;
  isActive: boolean;
}

export interface ProductImage {
  id: number;
  productId: number;
  variantId?: number;
  imageUrl: string;
  altText: string;
  sortOrder: number;
  isMain: boolean;
}

export interface Marca {
  id: number;
  name: string;
  description: string;
  logo: string;
}

export interface Categoria {
  id: number;
  name: string;
  description: string;
  parentId?: number;
  image: string;
}

export interface Talla {
  id: number;
  name: string;
  productType: string;
}

export interface Color {
  id: number;
  name: string;
  hexCode: string;
}

export interface Etiqueta {
  id: number;
  name: string;
  slug: string;
}

// Cart Models
export interface Carrito {
  id: number;
  clienteId: number;
  createdAt: string;
  updatedAt: string;
  items: CarritoItem[];
}

export interface CarritoItem {
  id: number;
  variantId: number;
  productName: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  color?: string;
  size?: string;
  quantity: number;
  addedAt: string;
}

export interface CarritoItemRequestDTO {
  productVariantId: number;
  quantity: number;
}

// Sale Models
export interface Sale {
  id: number;
  orderNumber: string;
  clienteId: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: 'card' | 'transfer' | 'cash' | 'paypal' | 'yape' | 'plin';
  notes: string;
  createdAt: string;
}

export interface SaleResponseDTO {
  id: number;
  orderNumber: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  customerName: string;
  items: SaleDetail[];
  createdAt: string;
}

export interface SaleRequestDTO {
  customerId: number;
  items: SaleDetailItemDTO[];
  discountAmount: number;
  shippingCost: number;
  paymentMethod: string;
  notes: string;
}

export interface SaleDetailItemDTO {
  variantId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
}

export interface SaleDetail {
  id: number;
  saleId: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
}

export interface Voucher {
  id: number;
  saleId: number;
  voucherType: 'boleta' | 'factura' | 'nota_credito';
  series: string;
  number: string;
  pdfUrl: string;
}

export interface PaymentTransaction {
  id: number;
  saleId: number;
  transactionId: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  responseData: string;
  createdAt: string;
}

export interface Shipment {
  id: number;
  saleId: number;
  direccionId: number;
  trackingNumber: string;
  carrier: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'returned';
  shippedAt: string;
  deliveredAt: string;
}

// Wishlist Models
export interface Wishlist {
  id: number;
  clienteId: number;
  name: string;
  isDefault: boolean;
  itemCount?: number;
  createdAt: string;
  items?: WishlistItem[];
}

export interface WishlistResponseDTO {
  id: number;
  name: string;
  isDefault: boolean;
  itemCount: number;
  createdAt: string;
}

export interface WishlistRequestDTO {
  name: string;
  isDefault: boolean;
}

export interface WishlistItem {
  id: number;
  wishlistId: number;
  productId: number;
  product?: {
    id: number;
    name: string;
    slug: string;
    basePrice: number;
    images?: string[];
  };
  addedAt: string;
}

// Review Models
export interface ProductReview {
  id: number;
  productId: number;
  clienteId: number;
  rating: number;
  title: string;
  comment: string;
  isApproved: boolean;
  createdAt: string;
}

export interface ProductReviewRequestDTO {
  productId: number;
  customerId: number;
  rating: number;
  title: string;
  comment: string;
}

export interface ProductQuestion {
  id: number;
  productId: number;
  clienteId: number;
  question: string;
  answer?: string;
  answeredAt?: string;
  createdAt: string;
}

// Discount Models
export interface Descuento {
  id: number;
  name: string;
  value: number;
  discountType: 'percentage' | 'fixed';
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CouponResponseDTO {
  id: number;
  code: string;
  discountType: string;
  value: number;
  minPurchase: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CouponRequestDTO {
  code: string;
  discountType: string;
  value: number;
  minPurchase: number;
  usageLimit: number;
}

// Inventory Models
export interface InventoryMovement {
  id: number;
  variantId: number;
  quantity: number;
  movementType: 'purchase' | 'sale' | 'returned' | 'adjustment' | 'damage';
  referenceId?: number;
  notes: string;
  createdAt: string;
}

export interface StockAlert {
  id: number;
  variantId: number;
  threshold: number;
  isActive: boolean;
}

// Notification Models
export interface Notification {
  id: number;
  userId?: number;
  customerId?: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

// Pagination
export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

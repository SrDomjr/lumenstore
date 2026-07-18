// ─── Strict Type Definitions for Sales Management Module ───
// Mapped from DB entities: sales, sale_details, vouchers, payment_transactions, shipments

// ── Enum-like Union Types ──
export type SaleStatus =
  'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export type PaymentMethod = 'card' | 'transfer' | 'cash' | 'paypal' | 'yape' | 'plin';

export type VoucherType = 'boleta' | 'factura' | 'nota_credito';

export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export type ShipmentStatus = 'pending' | 'in_transit' | 'delivered' | 'returned';

// ── Address (inline for shipments) ──
export interface IAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// ── Sale ──
export interface ISale {
  id: number;
  customerId: number;
  userId: number;
  orderNumber: string;
  status: SaleStatus;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  notes: string;
  createdAt: string; // ISO date string
  // Populated relations (optional until fetched)
  customerName?: string;
  userFullName?: string;
  items?: ISaleDetail[];
  vouchers?: IVoucher[];
  paymentTransactions?: IPaymentTransaction[];
  shipments?: IShipment[];
}

// ── Sale Detail ──
export interface ISaleDetail {
  id?: number;
  saleId?: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  subtotal: number;
  // Display enrichment (not from DB directly)
  productName?: string;
  sku?: string;
  imageUrl?: string;
  sizeName?: string;
  colorName?: string;
  colorHex?: string;
}

// ── Voucher ──
export interface IVoucher {
  id: number;
  saleId: number;
  voucherType: VoucherType;
  series: string;
  number: string;
  pdfUrl: string;
}

// ── Payment Transaction ──
export interface IPaymentTransaction {
  id: number;
  saleId: number;
  transactionId: string;
  amount: number;
  status: PaymentTransactionStatus;
  paymentMethod: string;
  responseData: string; // JSON string
  createdAt: string;
}

// ── Shipment ──
export interface IShipment {
  id: number;
  saleId: number;
  trackingNumber: string;
  carrier: string;
  status: ShipmentStatus;
  shippedAt: string;
  deliveredAt: string;
  addressId?: number;
  address?: IAddress;
}

// ── State machine transitions (valid next states) ──
export const SALE_STATUS_TRANSITIONS: Record<SaleStatus, SaleStatus[]> = {
  pending: ['paid', 'processing', 'cancelled'],
  paid: ['processing', 'refunded', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

// ── Status display config ──
export interface StatusConfig {
  label: string;
  color: string; // Tailwind color classes
  icon: string; // SVG path or emoji
}

export const SALE_STATUS_CONFIG: Record<SaleStatus, StatusConfig> = {
  pending: {
    label: 'Pendiente',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  paid: {
    label: 'Pagado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  processing: {
    label: 'En Proceso',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  shipped: {
    label: 'Enviado',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: 'M5 13l4 4L19 7',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-neutral-50 text-neutral-500 border-neutral-200',
    icon: 'M6 18L18 6M6 6l12 12',
  },
  refunded: {
    label: 'Reembolsado',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
};

export const SHIPMENT_STATUS_CONFIG: Record<ShipmentStatus, StatusConfig> = {
  pending: {
    label: 'Pendiente',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  in_transit: {
    label: 'En Tránsito',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: 'M5 13l4 4L19 7',
  },
  returned: {
    label: 'Devuelto',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentTransactionStatus, StatusConfig> = {
  pending: {
    label: 'Pendiente',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  completed: {
    label: 'Completado',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  failed: {
    label: 'Fallido',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z',
  },
  refunded: {
    label: 'Reembolsado',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  },
};

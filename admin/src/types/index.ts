export interface Permission {
  id: number;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface Role {
  id: number;
  code: string;
  name: string;
  description?: string;
  permissions?: { permission: Permission }[];
}

export interface Staff {
  id: number;
  staffCode: string;
  name: string;
  email: string;
  roleId?: number;
  role: Role | string;
  isActive?: boolean;
  createdAt?: string;
  permissions?: string[];
}

export interface CategoryAttribute {
  id: number;
  categoryId: number;
  attributeId: number;
  isRequired: boolean;
  isFilterable: boolean;
  isVariant: boolean;
  sortOrder: number;
  attribute: Attribute;
}

export interface Category {
  id: number;
  categoryCode: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number | null;
  sortOrder: number;
  gstRate?: number;
  isActive: boolean;
  parent?: Category | null;
  children?: Category[];
  categoryAttributes?: CategoryAttribute[];
  productsCount?: number;
  deletedAt?: string | null;
  deletedBy?: number | null;
}

export interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
  displayName: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  dataType: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'RANGE';
  unit?: string;
  isActive: boolean;
  values?: AttributeValue[];
  deletedAt?: string | null;
}

export interface Brand {
  id: number;
  brandCode: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isActive: boolean;
  productsCount?: number;
  deletedAt?: string | null;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number;
  stockQuantity: number;
  barcode?: string;
  weight?: number;
  status: 'ACTIVE' | 'INACTIVE';
  variantAttributeValues?: {
    attributeId: number;
    attributeValueId: number;
    attribute: Attribute;
    attributeValue: AttributeValue;
  }[];
}

export interface ProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Product {
  id: number;
  productCode: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: number;
  brandId: number;
  basePrice: number;
  minStockAlert: number;
  useCategoryGst?: boolean;
  gstRate?: number | null;
  effectiveGstRate?: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];
  variants?: ProductVariant[];
  totalStock?: number;
  isLowStock?: boolean;
  deletedAt?: string | null;
  createdAt: string;
}

export interface InventoryTransaction {
  id: number;
  productId: number;
  variantId?: number | null;
  staffId?: number | null;
  type: 'INITIAL' | 'RESTOCK' | 'ORDER_DEDUCTION' | 'ADJUSTMENT' | 'RETURN';
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  createdAt: string;
  product?: { name: string; productCode: string };
  variant?: { sku: string };
  staff?: { name: string };
}

export interface OrderItem {
  id: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxableValue?: number;
  gstRate?: number;
  gstAmount?: number;
  supplyType?: 'INTRA_STATE' | 'INTER_STATE';
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  snapshot: any;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  user?: { name: string; email?: string; phone?: string; userCode: string };
  subtotal: number;
  shippingFee: number;
  taxableAmount?: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  supplyType?: 'INTRA_STATE' | 'INTER_STATE';
  sellerStateCode?: string;
  customerStateCode?: string;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  orderStatus: string;
  paymentStatus: string;
  shippingAddress: any;
  items: OrderItem[];
  delivery?: {
    id: number;
    trackingNumber?: string;
    status: string;
    deliveryPartner?: DeliveryPartner;
  };
  createdAt: string;
}

export interface PaymentGateway {
  id: number;
  code: string;
  name: string;
  isEnabled: boolean;
  mode: 'TEST' | 'LIVE';
  keyId?: string;
  hasSecretKey?: boolean;
  hasWebhookSecret?: boolean;
  supportedMethods: string[];
}

export interface DeliveryPartner {
  id: number;
  partnerCode: string;
  name: string;
  contactPhone?: string;
  contactEmail?: string;
  trackingUrlTemplate?: string;
  isActive: boolean;
}

export interface Review {
  id: number;
  userId: number;
  productId: number;
  orderId: number;
  rating: number;
  title: string;
  comment: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user?: { name: string; email?: string; phone?: string };
  product?: { name: string; slug: string; productCode: string };
}

export interface AuditLog {
  id: number;
  staffId: number;
  action: string;
  entityType: string;
  entityId?: number | null;
  oldValueJson?: any;
  newValueJson?: any;
  ipAddress?: string;
  createdAt: string;
  staff?: { name: string; email: string; staffCode: string };
}

export interface DashboardSummary {
  totalRevenue: number;
  ordersCount: number;
  productsCount: number;
  lowStockCount: number;
  recentOrders: Order[];
  recentAuditLogs: AuditLog[];
  ordersByStatus: Record<string, number>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface Customer {
  id: number;
  userCode: string;
  name: string;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
  reviewCount: number;
  addressCount: number;
  totalSpent: number;
  addresses?: any[];
  recentOrders?: any[];
}

export interface CustomerFeedback {
  id: number;
  name: string;
  email: string;
  rating: number;
  feedback: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface SpotBillItem {
  id: number;
  spotBillId: number;
  productId: number;
  variantId?: number | null;
  productNameSnapshot: string;
  productCodeSnapshot: string;
  brandSnapshot?: string | null;
  skuSnapshot: string;
  variantLabelSnapshot?: string | null;
  imageUrlSnapshot?: string | null;
  unitPrice: number;
  quantity: number;
  returnedQuantity: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalPrice: number;
  createdAt?: string;
}

export interface SpotBillPayment {
  id: number;
  spotBillId: number;
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  amount: number;
  amountReceived?: number | null;
  changeReturned?: number | null;
  referenceNumber?: string | null;
  status: string;
  createdAt: string;
}

export interface SpotBillReturnItem {
  id: number;
  returnId: number;
  spotBillItemId: number;
  productId: number;
  variantId?: number | null;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  createdAt: string;
}

export interface SpotBillReturn {
  id: number;
  returnNumber: string;
  spotBillId: number;
  staffId: number;
  staffName: string;
  reason: string;
  refundAmount: number;
  refundMethod: string;
  refundReference?: string | null;
  status: string;
  createdAt: string;
  items?: SpotBillReturnItem[];
}

export interface SpotBill {
  id: number;
  billNumber: string;
  invoiceNumber: string;
  customerId?: number | null;
  cashierId: number;
  cashierName: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerGstin?: string | null;
  customerAddress?: string | null;
  customerState: string;
  customerStateCode: string;
  supplyType: 'INTRA_STATE' | 'INTER_STATE';
  subtotal: number;
  discountType?: 'FIXED' | 'PERCENTAGE' | null;
  discountValue?: number | null;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'CANCELLED';
  billStatus: 'COMPLETED' | 'PARTIALLY_RETURNED' | 'FULLY_RETURNED' | 'CANCELLED';
  paymentMethod: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  paymentReference?: string | null;
  amountReceived?: number | null;
  changeReturned?: number | null;
  notes?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: number | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  items: SpotBillItem[];
  payments?: SpotBillPayment[];
  returns?: SpotBillReturn[];
  cashier?: { id: number; name: string; staffCode?: string };
  customer?: { id: number; userCode: string; name: string; email?: string; phone?: string };
}


export interface Category {
  id: number;
  categoryCode: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number | null;
  gstRate?: number;
  children?: Category[];
}

export interface Brand {
  id: number;
  brandCode: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface AttributeValue {
  id: number;
  value: string;
  displayName: string;
  sortOrder?: number;
}

export interface InheritedAttribute {
  id: number;
  name: string;
  slug: string;
  dataType: string;
  unit?: string;
  isRequired: boolean;
  isFilterable: boolean;
  isVariant: boolean;
  sourceCategoryName: string;
  isInherited: boolean;
  values: AttributeValue[];
}

export interface DynamicFilterFacet {
  id: number;
  name: string;
  slug: string;
  dataType: string;
  unit?: string;
  isVariant: boolean;
  options: { value: string; displayName: string; count: number }[];
}

export interface CategoryFiltersResponse {
  priceRange: { min: number; max: number };
  brands: { id: number; name: string; slug: string; count: number }[];
  attributes: DynamicFilterFacet[];
}

export interface VariantAttributeValue {
  attributeId: number;
  attributeValueId: number;
  attribute: { name: string; slug: string };
  attributeValue: { value: string; displayName: string };
}

export interface ProductVariant {
  id: number;
  sku: string;
  price: number;
  stockQuantity: number;
  status: string;
  variantValues: VariantAttributeValue[];
}

export interface ProductImage {
  id: number;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductAttributeValue {
  attributeId: number;
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  attribute: { name: string; slug: string; unit?: string };
  attributeValue?: { value: string; displayName: string };
}

export interface Product {
  id: number;
  productCode: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  minStockAlert: number;
  brand: Brand;
  category: Category;
  categoryId?: number;
  useCategoryGst?: boolean;
  gstRate?: number;
  effectiveGstRate?: number;
  images: ProductImage[];
  primaryImage?: string;
  variants: ProductVariant[];
  totalStock: number;
  isLowStock: boolean;
  rating: number;
  reviewsCount?: number;
  totalReviews?: number;
  ratingDistribution?: Record<number, number>;
  attributeValues?: ProductAttributeValue[];
  breadcrumbs?: { id: number; name: string; slug: string }[];
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productCode: string;
  brandName: string;
  image?: string;
  variantId?: number | null;
  sku?: string;
  variantDescription?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstRate?: number;
  gstAmount?: number;
  currentStock: number;
  isAvailable: boolean;
  stockWarning?: string | null;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  taxAmount?: number;
  allItemsAvailable: boolean;
}

export interface User {
  id: number;
  userCode: string;
  name?: string;
  email?: string;
  phone?: string;
  addresses?: UserAddress[];
}

export interface UserAddress {
  id?: number;
  recipientName?: string;
  fullName?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode?: string;
  postalCode?: string;
  country?: string;
  addressType?: 'HOME' | 'WORK' | 'OTHER';
  isDefault?: boolean;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstRate?: number;
  gstAmount?: number;
  snapshot: {
    name: string;
    brand: string;
    sku?: string;
    image?: string;
    gstRate?: number;
    gstAmount?: number;
  };
}

export interface Order {
  id: number;
  orderNumber: string;
  totalAmount: number;
  subtotal?: number;
  shippingFee?: number;
  taxAmount?: number;
  orderStatus: string;
  paymentStatus: string;
  itemCount: number;
  items: OrderItem[];
  shippingAddress?: UserAddress;
  delivery?: {
    status: string;
    trackingNumber?: string;
    deliveryPartner?: { name: string; trackingUrlTemplate?: string };
  };
  createdAt: string;
}

export interface Review {
  id: number;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  user: { id: number; name: string };
}

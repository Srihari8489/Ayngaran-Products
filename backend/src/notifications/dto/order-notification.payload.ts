export interface OrderCreatedData {
  orderId: number;
  orderNumber: string;
  customer: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
  itemCount: number;
  quantity: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  createdAt: string;
  items?: Array<{
    id: number;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    variantLabel?: string;
  }>;
}

export interface OrderCreatedPayload {
  event: 'order.created';
  data: OrderCreatedData;
}

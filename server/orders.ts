/**
 * Server-side Order Management
 *
 * Handles order creation, updates, and payment tracking
 */

import { db } from "@/db";
import { order, orderItem } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface CreateOrderParams {
  organizationId: string;
  tableId: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount?: number;
  tipAmount?: number;
  totalAmount: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

/**
 * Creates a new order in the database
 * This should be called BEFORE creating a payment preference
 *
 * @param params - Order creation parameters
 * @returns The created order with ID
 */
export async function createOrder(params: CreateOrderParams) {
  const orderId = randomUUID();
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Calculate amounts
  const taxAmount = params.taxAmount ?? 0;
  const tipAmount = params.tipAmount ?? 0;

  // Create the order
  const [newOrder] = await db
    .insert(order)
    .values({
      id: orderId,
      organizationId: params.organizationId,
      tableId: params.tableId,
      orderNumber: orderNumber,
      status: "pending",
      orderType: "dine-in",
      subtotal: params.subtotal.toString(),
      taxAmount: taxAmount.toString(),
      tipAmount: tipAmount.toString(),
      totalAmount: params.totalAmount.toString(),
      notes: params.notes,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      paymentStatus: "pending",
    })
    .returning();

  // Create order items
  const orderItemsData = params.items.map((item) => ({
    id: randomUUID(),
    orderId: orderId,
    menuItemId: null, // For now, we don't link to menu items (customer order via QR)
    itemName: item.name,
    quantity: item.quantity,
    unitPrice: item.price.toString(),
    totalPrice: (item.price * item.quantity).toString(),
    status: "pending",
  }));

  if (orderItemsData.length > 0) {
    await db.insert(orderItem).values(orderItemsData);
  }

  return newOrder;
}

/**
 * Updates order with payment information
 *
 * @param orderId - The order ID
 * @param paymentData - Payment tracking data
 */
export async function updateOrderPayment(
  orderId: string,
  paymentData: {
    paymentProcessor: string;
    paymentId: string;
    preferenceId: string;
    paymentStatus: string;
    paymentMetadata?: Record<string, unknown>;
    processorFee?: number;
    marketplaceFee?: number;
  }
) {
  const [updatedOrder] = await db
    .update(order)
    .set({
      paymentProcessor: paymentData.paymentProcessor,
      paymentId: paymentData.paymentId,
      preferenceId: paymentData.preferenceId,
      paymentStatus: paymentData.paymentStatus,
      paymentMetadata: paymentData.paymentMetadata,
      processorFee: paymentData.processorFee?.toString() ?? "0.00",
      marketplaceFee: paymentData.marketplaceFee?.toString() ?? "0.00",
      updatedAt: new Date(),
    })
    .where(eq(order.id, orderId))
    .returning();

  return updatedOrder;
}

/**
 * Updates order status when payment is confirmed
 *
 * @param orderId - The order ID
 * @param status - The new payment status
 * @param isPaid - Whether the payment is completed
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  isPaid: boolean = false
) {
  const updateData: {
    paymentStatus: string;
    status: string;
    paidAt?: Date;
    updatedAt: Date;
  } = {
    paymentStatus: status,
    status: isPaid ? "paid" : "pending",
    updatedAt: new Date(),
  };

  if (isPaid) {
    updateData.paidAt = new Date();
  }

  const [updatedOrder] = await db
    .update(order)
    .set(updateData)
    .where(eq(order.id, orderId))
    .returning();

  return updatedOrder;
}

/**
 * Retrieves an order by ID
 *
 * @param orderId - The order ID
 * @returns The order or null if not found
 */
export async function getOrderById(orderId: string) {
  const [orderData] = await db
    .select()
    .from(order)
    .where(eq(order.id, orderId))
    .limit(1);

  return orderData || null;
}

/**
 * Retrieves an order by payment ID
 *
 * @param paymentId - The external payment processor payment ID
 * @returns The order or null if not found
 */
export async function getOrderByPaymentId(paymentId: string) {
  const [orderData] = await db
    .select()
    .from(order)
    .where(eq(order.paymentId, paymentId))
    .limit(1);

  return orderData || null;
}

/**
 * Retrieves an order by preference ID
 *
 * @param preferenceId - The payment preference ID
 * @returns The order or null if not found
 */
export async function getOrderByPreferenceId(preferenceId: string) {
  const [orderData] = await db
    .select()
    .from(order)
    .where(eq(order.preferenceId, preferenceId))
    .limit(1);

  return orderData || null;
}

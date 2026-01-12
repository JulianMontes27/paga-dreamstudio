import { db } from "@/db";
import { order, orderItem } from "@/db/schema";
import { eq } from "drizzle-orm";

interface CreateOrderParams {
  organizationId: string;
  tableId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  taxAmount: number;
  tipAmount: number;
  totalAmount: number;
  notes?: string;
}

interface UpdateOrderPaymentParams {
  paymentProcessor: string;
  paymentId: string;
  preferenceId: string;
  paymentStatus: string;
  paymentMetadata: Record<string, any>;
}

/**
 * Create a new order
 */
export async function createOrder(params: CreateOrderParams) {
  const {
    organizationId,
    tableId,
    items,
    subtotal,
    taxAmount,
    tipAmount,
    totalAmount,
    notes,
  } = params;

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create the order
  const [newOrder] = await db
    .insert(order)
    .values({
      id: orderId,
      organizationId,
      tableId,
      orderNumber,
      orderType: "dine_in",
      status: "ordering",
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      tipAmount: tipAmount ? tipAmount.toString() : null,
      totalAmount: totalAmount.toString(),
      notes: notes || null,
      isLocked: false,
    })
    .returning();

  // Create order items
  const orderItems = items.map((item) => ({
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    orderId,
    menuItemId: null, // You may want to match items to menu items
    itemName: item.name,
    quantity: item.quantity,
    unitPrice: item.price.toString(),
    totalPrice: (item.price * item.quantity).toString(),
    status: "pending",
  }));

  await db.insert(orderItem).values(orderItems);

  return newOrder;
}

/**
 * Update order payment information
 */
export async function updateOrderPayment(
  orderId: string,
  params: UpdateOrderPaymentParams
) {
  const [updatedOrder] = await db
    .update(order)
    .set({
      paymentProcessor: params.paymentProcessor,
      paymentId: params.paymentId,
      preferenceId: params.preferenceId,
      paymentStatus: params.paymentStatus,
      paymentMetadata: params.paymentMetadata,
      updatedAt: new Date(),
    })
    .where(eq(order.id, orderId))
    .returning();

  return updatedOrder;
}

/**
 * Get order by ID
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
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string) {
  const [updatedOrder] = await db
    .update(order)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(order.id, orderId))
    .returning();

  return updatedOrder;
}

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/db/server-client";
import { TableDetailView } from "@/components/tables/table-detail-view";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { OrderItem } from "@/db";

export default async function TableDetailPage({
  params,
}: {
  params: Promise<{ userId: string; orgId: string; mesaId: string }>;
}) {
  const { userId, orgId, mesaId } = await params;

  // Auth check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user || session.user.id !== userId) {
    redirect("/sign-in");
  }

  const supabase = await createClient();

  // Fetch table
  const { data: tableData, error: tableError } = await supabase
    .from("table")
    .select("*")
    .eq("id", mesaId)
    .eq("organization_id", orgId)
    .single();

  if (tableError || !tableData) {
    notFound();
  }

  // Fetch orders with their items
  const { data: ordersData, error: ordersError } = await supabase
    .from("order")
    .select(
      `
      *,
      order_item (*)
    `
    )
    .eq("table_id", mesaId)
    .order("created_at", { ascending: false });

  if (ordersError) return;

  const orders = ordersData || [];

  // Find active order
  const activeOrder =
    orders.find(
      (o) =>
        o.status === "ordering" ||
        o.status === "payment_started" ||
        o.status === "partially_paid"
    ) || null;

  // Calculate stats
  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === "paid");
  const activeOrders = orders.filter(
    (o) =>
      o.status === "ordering" ||
      o.status === "payment_started" ||
      o.status === "partially_paid"
  );

  const totalRevenue = paidOrders.reduce(
    (sum, o) => sum + parseFloat(o.total_amount || "0"),
    0
  );

  const stats = {
    totalOrders,
    totalRevenue,
    activeOrdersCount: activeOrders.length,
  };

  // Get user's role
  const { data: memberData } = await supabase
    .from("member")
    .select("role")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .single();

  const userRole = memberData?.role || "member";

  // Get organization slug
  const organizationSlug = orgId;

  // Map snake_case to camelCase for the component
  const mappedTable = {
    id: tableData.id,
    tableNumber: tableData.table_number,
    capacity: tableData.capacity,
    status: tableData.status,
    section: tableData.section,
    isQrEnabled: false,
    createdAt: new Date(tableData.created_at),
    updatedAt: new Date(tableData.updated_at),
    qrCode: null,
  };

  const mappedOrders = orders.map((order) => ({
    id: order.id,
    organizationId: order.organization_id,
    tableId: order.table_id,
    orderNumber: order.order_number,
    status: order.status,
    orderType: order.order_type,
    subtotal: order.subtotal,
    taxAmount: order.tax_amount,
    tipAmount: order.tip_amount,
    totalAmount: order.total_amount,
    totalPaid: order.total_paid,
    notes: order.notes,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    createdBy: order.created_by,
    servedBy: order.served_by,
    paidAt: order.paid_at ? new Date(order.paid_at) : null,
    createdAt: new Date(order.created_at),
    updatedAt: new Date(order.updated_at),
    orderItems: (order.order_item || []).map((item: OrderItem) => ({
      id: item.id,
      orderId: item.orderId,
      menuItemId: item.menuItemId,
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      specialInstructions: item.specialInstructions,
      status: item.status,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
      menuItem: null,
    })),
  }));

  const mappedActiveOrder = activeOrder
    ? mappedOrders.find((o) => o.id === activeOrder.id) || null
    : null;

  return (
    <TableDetailView
      table={mappedTable}
      activeOrder={mappedActiveOrder}
      orders={mappedOrders}
      stats={stats}
      organizationSlug={organizationSlug}
      userRole={userRole as "member" | "admin" | "owner"}
    />
  );
}

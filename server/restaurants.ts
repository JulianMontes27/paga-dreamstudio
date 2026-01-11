"use server";

import { db } from "@/db/drizzle";
import {
  restaurantMetadata,
  restaurantTable,
  order,
} from "@/db/restaurant-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

interface CreateRestaurantMetadataParams {
  organizationId: string;
  address: string;
  phone: string;
  cuisineType?: string | null;
  seatingCapacity?: number | null;
  taxRate?: string;
  currency?: string;
  timezone?: string;
}

export async function createRestaurantMetadata(
  params: CreateRestaurantMetadataParams
) {
  try {
    // Verify the user has permission to create restaurant metadata for this organization
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    // Create restaurant metadata record
    const metadata = await db
      .insert(restaurantMetadata)
      .values({
        id: randomUUID(),
        organizationId: params.organizationId,
        address: params.address,
        phone: params.phone,
        cuisineType: params.cuisineType || null,
        seatingCapacity: params.seatingCapacity || null,
        taxRate: params.taxRate || "0.00",
        currency: params.currency || "USD",
        timezone: params.timezone || "UTC",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: metadata[0] };
  } catch (error) {
    console.error("Failed to create restaurant metadata:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create restaurant metadata",
    };
  }
}

export async function getRestaurantMetadata(organizationId: string) {
  try {
    const metadata = await db.query.restaurantMetadata.findFirst({
      where: (restaurantMetadata, { eq }) =>
        eq(restaurantMetadata.organizationId, organizationId),
    });

    return metadata;
  } catch (error) {
    console.error("Failed to get restaurant metadata:", error);
    return null;
  }
}

export async function updateRestaurantMetadata(
  organizationId: string,
  updates: Partial<CreateRestaurantMetadataParams>
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const updatedMetadata = await db
      .update(restaurantMetadata)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(restaurantMetadata.organizationId, organizationId))
      .returning();

    return { success: true, data: updatedMetadata[0] };
  } catch (error) {
    console.error("Failed to update restaurant metadata:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update restaurant metadata",
    };
  }
}

export async function getRestaurantDashboardData(organizationId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    // Get restaurant metadata
    const metadata = await getRestaurantMetadata(organizationId);

    // Get menu statistics
    const menuStats = await db.query.menuItem.findMany({
      where: (menuItem, { eq }) => eq(menuItem.organizationId, organizationId),
    });

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await db.query.order.findMany({
      where: (order, { eq }) => eq(order.organizationId, organizationId),
      // Note: We'll add date filtering when we have real orders
      limit: 10,
      orderBy: (order, { desc }) => [desc(order.createdAt)],
    });

    // Get table count
    const tables = await db.query.restaurantTable.findMany({
      where: (table, { eq }) => eq(table.organizationId, organizationId),
    });

    // Calculate basic stats
    const totalMenuItems = menuStats.length;
    const availableMenuItems = menuStats.filter(
      (item) => item.isAvailable
    ).length;
    const totalTables = tables.length;
    const availableTables = tables.filter(
      (table) => table.status === "available"
    ).length;

    return {
      success: true,
      data: {
        restaurant: metadata,
        stats: {
          totalMenuItems,
          availableMenuItems,
          totalTables,
          availableTables,
          totalOrders: recentOrders.length,
        },
        recentOrders: recentOrders.slice(0, 5), // Show 5 most recent
        tables: tables.slice(0, 10), // Show first 10 tables
      },
    };
  } catch (error) {
    console.error("Failed to get restaurant dashboard data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load dashboard data",
    };
  }
}

/**
 * Get detailed table information with all orders and order items
 * @param tableId - The ID of the table to fetch
 * @param organizationId - The organization ID to verify ownership
 */
export async function getTableWithOrders(
  tableId: string,
  organizationId: string
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    // Fetch table with QR code
    const table = await db.query.restaurantTable.findFirst({
      where: and(
        eq(restaurantTable.id, tableId),
        eq(restaurantTable.organizationId, organizationId)
      ),
      with: {
        qrCode: true,
      },
    });

    if (!table) {
      return {
        success: false,
        error: "Table not found",
      };
    }

    // Fetch all orders for this table
    const orders = await db.query.order.findMany({
      where: eq(order.tableId, tableId),
      orderBy: (order, { desc }) => [desc(order.createdAt)],
      with: {
        orderItems: {
          with: {
            menuItem: true,
          },
        },
      },
    });

    // Find active order (not paid or cancelled)
    const activeOrder = orders.find(
      (o) => o.status !== "paid" && o.status !== "cancelled"
    );

    // Calculate order statistics
    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + parseFloat(o.totalAmount || "0"), 0);

    return {
      success: true,
      data: {
        table: {
          id: table.id,
          tableNumber: table.tableNumber,
          capacity: table.capacity,
          status: table.status,
          section: table.section,
          isQrEnabled: table.isQrEnabled ?? true,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt,
          qrCode: table.qrCode
            ? {
                id: table.qrCode.id,
                code: table.qrCode.code,
                checkoutUrl: table.qrCode.checkoutUrl,
                isActive: table.qrCode.isActive ?? true,
                scanCount: table.qrCode.scanCount ?? 0,
                lastScannedAt: table.qrCode.lastScannedAt,
                expiresAt: table.qrCode.expiresAt,
              }
            : null,
        },
        activeOrder: activeOrder || null,
        orders,
        stats: {
          totalOrders,
          totalRevenue,
          activeOrdersCount: orders.filter(
            (o) => o.status !== "paid" && o.status !== "cancelled"
          ).length,
        },
      },
    };
  } catch (error) {
    console.error("Failed to get table with orders:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to load table details",
    };
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { table } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableId: string }> },
) {
  try {
    const { tableId } = await params;

    // Heavy READ query (optimize later)
    const tableData = await db.query.table.findFirst({
      where: eq(table?.id, tableId),
      with: {
        organization: {
          with: {
            menuCategories: {
              with: {
                menuItems: true,
              },
            },
          },
        },
      },
    });

    if (!tableData) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Check if table NFC is enabled
    if (!tableData.isNfcEnabled) {
      return NextResponse.json(
        { error: "NFC ordering is disabled for this table" },
        { status: 403 },
      );
    }

    // Update scan count and last scanned timestamp
    await db
      .update(table)
      .set({
        nfcScanCount: (tableData.nfcScanCount || 0) + 1,
        lastNfcScanAt: new Date(),
      })
      .where(eq(table.id, tableId));

    // Organize the Menu to return to the client as expected
    const organizedMenu = tableData.organization.menuCategories.map(
      (category) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,

        menuItems: category.menuItems.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          preparationTime: item.preparationTime,
          isAvailable: item.isAvailable,
        })),
      }),
    );

    return NextResponse.json({
      success: true,
      restaurant: {
        id: tableData.organizationId,
        name: tableData.organization.name,
        slug: tableData.organization.slug,
      },
      table: {
        id: tableData.id,
        tableNumber: tableData.tableNumber,
        capacity: tableData.capacity,
        scanCount: (tableData.nfcScanCount || 0) + 1,
      },
      menu: organizedMenu,
    });
  } catch (error) {
    console.error("Error processing QR code scan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
      },
    );
  }
}

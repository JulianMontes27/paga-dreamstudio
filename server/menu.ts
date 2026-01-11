"use server";

import { cache } from "react";
import { db } from "@/db/drizzle";
import { menuCategory, menuItem } from "@/db/restaurant-schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";

/**
 * Menu Management Server Actions
 *
 * Handles CRUD operations for menu categories and menu items
 */

// ============================================================================
// MENU CATEGORIES
// ============================================================================

/**
 * Get all menu categories for an organization
 */
export const getMenuCategories = cache(async (organizationId: string) => {
  try {
    const categories = await db
      .select()
      .from(menuCategory)
      .where(eq(menuCategory.organizationId, organizationId))
      .orderBy(menuCategory.displayOrder, menuCategory.name);

    return categories;
  } catch (error) {
    console.error("Error fetching menu categories:", error);
    return [];
  }
});

/**
 * Get all menu items for an organization, optionally filtered by category
 */
export const getMenuItems = cache(
  async (organizationId: string, categoryId?: string) => {
    try {
      const conditions = [eq(menuItem.organizationId, organizationId)];

      if (categoryId) {
        conditions.push(eq(menuItem.categoryId, categoryId));
      }

      const items = await db
        .select()
        .from(menuItem)
        .where(and(...conditions))
        .orderBy(menuItem.name);

      return items;
    } catch (error) {
      console.error("Error fetching menu items:", error);
      return [];
    }
  }
);

/**
 * Get menu with categories and items (for display)
 */
export const getFullMenu = cache(async (organizationId: string) => {
  try {
    // Get all categories
    const categories = await db
      .select()
      .from(menuCategory)
      .where(eq(menuCategory.organizationId, organizationId))
      .orderBy(menuCategory.displayOrder, menuCategory.name);

    // Get all menu items
    const items = await db
      .select()
      .from(menuItem)
      .where(eq(menuItem.organizationId, organizationId))
      .orderBy(menuItem.name);

    // Group items by category
    const menuWithItems = categories.map((category) => ({
      ...category,
      items: items.filter((item) => item.categoryId === category.id),
    }));

    // Add uncategorized items
    const uncategorizedItems = items.filter((item) => !item.categoryId);
    if (uncategorizedItems.length > 0) {
      menuWithItems.push({
        id: "uncategorized",
        organizationId,
        name: "Uncategorized",
        description: null,
        displayOrder: 999,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        items: uncategorizedItems,
      });
    }

    return menuWithItems;
  } catch (error) {
    console.error("Error fetching full menu:", error);
    return [];
  }
});
/**
 * Create a new menu category
 */
export async function createMenuCategoryAction(data: {
  organizationId: string;
  name: string;
  description?: string;
  displayOrder?: number;
}) {
  try {
    const categoryId = `mcat_${nanoid()}`;

    const newCategory = await db
      .insert(menuCategory)
      .values({
        id: categoryId,
        organizationId: data.organizationId,
        name: data.name,
        description: data.description || null,
        displayOrder: data.displayOrder || 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath(`/dashboard/[slug]/menu`, "page");

    return {
      success: true,
      category: newCategory[0],
    };
  } catch (error) {
    console.error("Error creating menu category:", error);
    return {
      success: false,
      error: "Failed to create category",
    };
  }
}

/**
 * Update a menu category
 */
export async function updateMenuCategoryAction(data: {
  categoryId: string;
  name?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}) {
  try {
    const updateData: Partial<typeof menuCategory.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await db
      .update(menuCategory)
      .set(updateData)
      .where(eq(menuCategory.id, data.categoryId))
      .returning();

    revalidatePath(`/dashboard/[slug]/menu`, "page");

    return {
      success: true,
      category: updated[0],
    };
  } catch (error) {
    console.error("Error updating menu category:", error);
    return {
      success: false,
      error: "Failed to update category",
    };
  }
}

/**
 * Delete a menu category
 */
export async function deleteMenuCategoryAction(categoryId: string) {
  try {
    await db.delete(menuCategory).where(eq(menuCategory.id, categoryId));

    revalidatePath(`/dashboard/[slug]/menu`, "page");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting menu category:", error);
    return {
      success: false,
      error: "Failed to delete category",
    };
  }
}

// ============================================================================
// MENU ITEMS
// ============================================================================

/**
 * Create a new menu item
 */
export async function createMenuItemAction(data: {
  organizationId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  preparationTime?: number;
  allergens?: string[];
}) {
  try {
    const itemId = `mitem_${nanoid()}`;

    const newItem = await db
      .insert(menuItem)
      .values({
        id: itemId,
        organizationId: data.organizationId,
        categoryId: data.categoryId || null,
        name: data.name,
        description: data.description || null,
        price: data.price.toString(),
        imageUrl: data.imageUrl || null,
        isAvailable: true,
        preparationTime: data.preparationTime || null,
        allergens: data.allergens || null,
        nutritionalInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath(`/dashboard/[slug]/menu`, "page");

    return {
      success: true,
      item: newItem[0],
    };
  } catch (error) {
    console.error("Error creating menu item:", error);
    return {
      success: false,
      error: "Failed to create menu item",
    };
  }
}

/**
 * Update a menu item
 */
export async function updateMenuItemAction(data: {
  itemId: string;
  categoryId?: string | null;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  isAvailable?: boolean;
  preparationTime?: number;
  allergens?: string[];
}) {
  try {
    const updateData: Partial<typeof menuItem.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price.toString();
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.preparationTime !== undefined)
      updateData.preparationTime = data.preparationTime;
    if (data.allergens !== undefined) updateData.allergens = data.allergens;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    const updated = await db
      .update(menuItem)
      .set(updateData)
      .where(eq(menuItem.id, data.itemId))
      .returning();

    revalidatePath(`/dashboard/[slug]/menu`, "page");

    return {
      success: true,
      item: updated[0],
    };
  } catch (error) {
    console.error("Error updating menu item:", error);
    return {
      success: false,
      error: "Failed to update menu item",
    };
  }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItemAction(itemId: string) {
  try {
    await db.delete(menuItem).where(eq(menuItem.id, itemId));

    revalidatePath(`/dashboard/[slug]/menu`, "page");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return {
      success: false,
      error: "Failed to delete menu item",
    };
  }
}

/**
 * Toggle menu item availability
 */
export async function toggleMenuItemAvailabilityAction(
  itemId: string,
  isAvailable: boolean
) {
  try {
    const updated = await db
      .update(menuItem)
      .set({
        isAvailable,
        updatedAt: new Date(),
      })
      .where(eq(menuItem.id, itemId))
      .returning();

    revalidatePath(`/dashboard/[slug]/menu`, "page");

    return {
      success: true,
      item: updated[0],
    };
  } catch (error) {
    console.error("Error toggling menu item availability:", error);
    return {
      success: false,
      error: "Failed to update availability",
    };
  }
}

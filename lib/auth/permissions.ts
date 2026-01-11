import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

// Restaurant-specific permission statements
const statement = {
  ...defaultStatements,
  // Menu management
  menu: ["create", "read", "update", "delete"],
  menuItem: ["create", "read", "update", "delete"],

  // Order management
  order: ["create", "read", "update", "delete", "cancel"],
  orderItem: ["create", "read", "update", "delete"],

  // Table management
  table: ["create", "read", "update", "delete", "assign"],

  // Inventory management
  inventory: ["create", "read", "update", "delete"],

  // Financial operations
  finance: ["viewReports", "viewRevenue", "managePricing", "procesRefunds"],

  // Staff management
  staff: ["invite", "remove", "updateRole", "viewSchedule", "manageSchedule"],

  // Restaurant settings
  restaurant: ["updateInfo", "updateHours", "updateSettings"],
} as const;

const ac = createAccessControl(statement);

// Waiter role - basic operations for serving customers
const member = ac.newRole({
  menu: ["read"],
  menuItem: ["read"],
  order: ["create", "read", "update"],
  orderItem: ["create", "read", "update"],
  table: ["read", "assign"],
});

// Backoffice/Manager role - operational management
const admin = ac.newRole({
  invitation: ["create", "cancel"],
  member: ["update"], // Can update member roles but not create or remove
  menu: ["create", "read", "update"],
  menuItem: ["create", "read", "update", "delete"],
  order: ["create", "read", "update", "cancel"],
  orderItem: ["create", "read", "update", "delete"],
  table: ["create", "read", "update", "delete", "assign"],
  inventory: ["create", "read", "update", "delete"],
  finance: ["viewReports"],
  staff: ["viewSchedule"],
  restaurant: ["updateHours"],
});

// Restaurant owner role - full access
const owner = ac.newRole({
  invitation: ["create", "cancel"],
  member: ["create", "update", "delete"], // Full member management
  organization: ["update", "delete"],
  menu: ["create", "read", "update", "delete"],
  menuItem: ["create", "read", "update", "delete"],
  order: ["create", "read", "update", "delete", "cancel"],
  orderItem: ["create", "read", "update", "delete"],
  table: ["create", "read", "update", "delete", "assign"],
  inventory: ["create", "read", "update", "delete"],
  finance: ["viewReports", "viewRevenue", "managePricing", "procesRefunds"],
  staff: ["invite", "remove", "updateRole", "viewSchedule", "manageSchedule"],
  restaurant: ["updateInfo", "updateHours", "updateSettings"],
});

// Export with more descriptive names for restaurant context
export {
  ac,
  admin as backoffice,
  member as waiter,
  owner as restaurantOwner,
  // Keep original names for backward compatibility
  admin,
  member,
  owner,
  statement,
};

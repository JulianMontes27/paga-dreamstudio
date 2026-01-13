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

  // Financial operations
  finance: ["viewReports", "viewRevenue", "managePricing", "procesRefunds"],

  // Staff management
  staff: ["invite", "remove", "updateRole", "viewSchedule", "manageSchedule"],

  // Restaurant settings
  restaurant: ["updateInfo", "updateHours", "updateSettings"],

  // Configuration access (admin panel)
  configuration: ["view", "manage"],
} as const;

const ac = createAccessControl(statement);

// Waiter role - basic operations for serving customers
const waiter = ac.newRole({
  menu: ["read"],
  menuItem: ["read"],
  order: ["create", "read", "update"],
  orderItem: ["create", "read", "update"],
  table: ["read", "assign"],
});

// Backoffice/Manager role - operational management
const administrator = ac.newRole({
  invitation: ["create", "cancel"],
  member: ["create", "update", "delete"], // Full member management
  menu: ["create", "read", "update", "delete"],
  menuItem: ["create", "read", "update", "delete"],
  order: ["create", "read", "update", "delete", "cancel"],
  orderItem: ["create", "read", "update", "delete"],
  table: ["create", "read", "update", "delete", "assign"],
  finance: ["viewReports", "viewRevenue", "managePricing", "procesRefunds"],
  staff: ["viewSchedule"],
  restaurant: ["updateHours"],
  configuration: ["view", "manage"],
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
  finance: ["viewReports", "viewRevenue", "managePricing", "procesRefunds"],
  restaurant: ["updateInfo", "updateHours", "updateSettings"],
  configuration: ["view", "manage"],
});

// Export with more descriptive names for restaurant context
export { ac, administrator, waiter, owner, statement };

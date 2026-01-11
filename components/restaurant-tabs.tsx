"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  BarChart3,
  ShoppingBag,
  UtensilsCrossed,
  Menu,
  Users,
  Package,
  Settings,
  DollarSign,
} from "lucide-react";

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

export const TabButton: React.FC<TabButtonProps> = ({
  icon,
  label,
  href,
  isActive = false,
}) => {
  // If active, render as span to prevent navigation
  if (isActive) {
    return (
      <span
        aria-label={label}
        aria-current="page"
        className="
          flex items-center gap-2
          px-2 py-2
          text-sm font-medium
          border-b-2
          border-primary text-primary
          whitespace-nowrap
          flex-shrink-0
          cursor-default
        "
      >
        {icon}
        {label}
      </span>
    );
  }

  // Otherwise render as Link for navigation
  return (
    <Link
      href={href}
      aria-label={label}
      className="
        flex items-center gap-2
        px-2 py-2
        text-sm font-medium
        border-b-2
        border-transparent text-muted-foreground
        hover:text-foreground hover:border-border
        transition-colors
        whitespace-nowrap
        flex-shrink-0
        touch-manipulation
      "
    >
      {icon}
      {label}
    </Link>
  );
};

export default function RestaurantTabs({
  role,
}: {
  role: "member" | "admin" | "owner";
}) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  // Use role-based checks directly for efficient client-side permission checks
  // These are synchronous and don't make API calls
  // Members can only view tables, orders, and menu
  // Admins and Owners can view everything
  const canViewStaff = role === "admin" || role === "owner";
  const canViewInventory = role === "admin" || role === "owner";
  const canViewAnalytics = role === "admin" || role === "owner";
  const canViewPayments = role === "admin" || role === "owner";
  const canViewSettings = role === "admin" || role === "owner";

  // Change Log
  // const { data: activeOrganization } = authClient.useActiveOrganization();

  // Problem with the line above:

  // 1. User navigates directly to /dashboard/pizza-palace/orders
  // via bookmark/link
  // 2. Session still has burger-king as active organization
  // 3. Server renders pizza-palace content (URL-based)
  // 4. Client tabs use burger-king for navigation (session-based)

  // The Solution:

  // The RestaurantTabs component should use the URL slug as the
  // source of truth, not the session:

  // // Instead of:
  // const { data: activeOrganization } =
  // authClient.useActiveOrganization();

  // // Should be:
  // const pathname = usePathname();
  // const slug = pathname.split('/')[2]; // Extract slug from URL

  // This ensures:
  // - Single source of truth: URL determines which organization
  // - Consistency: Tabs always match the page being viewed
  // - No sync issues: Navigation stays within the same
  // organization context

  // The session's active organization should only be used for:
  // - Initial redirect after login
  // - Organization switcher component
  // - Setting default when no slug in URL

  // Hook that reads the current URL's pathname
  const pathSegments = pathname.split("/");
  const slug = pathSegments[2]; // Extract slug from URL
  if (!slug) return null;

  // Determine active tab from pathname
  const getActiveTab = () => {
    const lastSegment = pathSegments[3]; // Gets section after slug
    return lastSegment || "overview";
  };

  const activeTab = getActiveTab();

  return (
    <div className="sticky top-[60px] z-40 bg-background border-b border-border">
      {/* Mobile: scrollable with fade indicator. Desktop: centered */}
      <div className="relative">
        {/* Right edge fade on mobile to indicate scrollable content */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none z-10 md:hidden" />

        <div
          className="
            flex gap-4 sm:gap-6
            overflow-x-auto
            pl-4 pr-12 md:px-4
            py-2
            md:justify-center
            scroll-smooth
            [-ms-overflow-style:none]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {/* Always visible tabs for all roles */}
        <TabButton
          icon={<UtensilsCrossed className="h-4 w-4" />}
          label={t('tables')}
          href={`/dashboard/${slug}/tables`}
          isActive={activeTab === "tables"}
        />
        <TabButton
          icon={<ShoppingBag className="h-4 w-4" />}
          label={t('orders')}
          href={`/dashboard/${slug}/orders`}
          isActive={activeTab === "orders"}
        />
        <TabButton
          icon={<Menu className="h-4 w-4" />}
          label={t('menu')}
          href={`/dashboard/${slug}/menu`}
          isActive={activeTab === "menu"}
        />

        {/* Conditionally visible tabs based on permissions */}
        {canViewStaff && (
          <TabButton
            icon={<Users className="h-4 w-4" />}
            label={t('staff')}
            href={`/dashboard/${slug}/staff`}
            isActive={activeTab === "staff"}
          />
        )}
        {canViewInventory && (
          <TabButton
            icon={<Package className="h-4 w-4" />}
            label={t('inventory')}
            href={`/dashboard/${slug}/inventory`}
            isActive={activeTab === "inventory"}
          />
        )}
        {canViewAnalytics && (
          <TabButton
            icon={<BarChart3 className="h-4 w-4" />}
            label={t('analytics')}
            href={`/dashboard/${slug}/analytics`}
            isActive={activeTab === "analytics"}
          />
        )}
        {canViewPayments && (
          <TabButton
            icon={<DollarSign className="h-4 w-4" />}
            label={t('payments')}
            href={`/dashboard/${slug}/payments`}
            isActive={activeTab === "payments"}
          />
        )}
        {canViewSettings && (
          <TabButton
            icon={<Settings className="h-4 w-4" />}
            label={t('settings')}
            href={`/dashboard/${slug}/settings`}
            isActive={activeTab === "settings"}
          />
        )}
        </div>
      </div>
    </div>
  );
}

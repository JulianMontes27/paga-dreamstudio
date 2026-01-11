import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Users, MapPin, ExternalLink } from "lucide-react";
import { TableActions } from "./table-actions";
import { QRCodeModal } from "./qr-code-modal";
import Link from "next/link";

/**
 * Table Status Configuration
 * Maps table status to visual styling and display information
 */
const TABLE_STATUS_CONFIG = {
  available: {
    label: "Available",
    color: "bg-green-100 text-green-800 border-green-200",
    indicator: "bg-green-500",
  },
  occupied: {
    label: "Occupied",
    color: "bg-red-100 text-red-800 border-red-200",
    indicator: "bg-red-500",
  },
  reserved: {
    label: "Reserved",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    indicator: "bg-yellow-500",
  },
  cleaning: {
    label: "Cleaning",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    indicator: "bg-blue-500",
  },
} as const;

/**
 * Table Card Props Interface
 */
interface TableCardProps {
  table: {
    id: string;
    tableNumber: string;
    capacity: number;
    status: "available" | "occupied" | "reserved" | "cleaning";
    section: string | null;
    isQrEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    qrCode: {
      id: string;
      code: string;
      checkoutUrl: string;
      isActive: boolean;
      scanCount: number;
      lastScannedAt: Date | null;
      expiresAt: Date | null;
    } | null;
  };
  userRole: "member" | "admin" | "owner";
  organizationSlug: string;
}

/**
 * Table Card Component - Server Component
 *
 * Displays individual table information in a card format.
 * Shows table status, capacity, section, and QR code information.
 * Integrates with client components for interactive features.
 *
 * This is a Server Component that renders static table data.
 * Interactive features are handled by child Client Components.
 */
export function TableCard({
  table,
  userRole,
  organizationSlug,
}: TableCardProps) {
  const statusConfig = TABLE_STATUS_CONFIG[table.status];
  const canManageTable = userRole === "admin" || userRole === "owner";

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      {/* Status Indicator Bar */}
      <div className={`h-1 w-full ${statusConfig.indicator}`} />

      <CardContent className="p-4 space-y-3">
        {/* Table Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">Table {table.tableNumber}</h3>
            {table.section && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {table.section}
              </div>
            )}
          </div>

          {/* Table Actions Menu */}
          <TableActions
            table={table}
            userRole={userRole}
            organizationSlug={organizationSlug}
          />
        </div>

        {/* Table Info */}
        <div className="space-y-2">
          {/* Capacity */}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{table.capacity} seats</span>
          </div>

          {/* Status Badge */}
          <Badge
            variant="outline"
            className={`${statusConfig.color} font-medium`}
          >
            {statusConfig.label}
          </Badge>
        </div>

        {/* QR Code Section */}
        {table.isQrEnabled && table.qrCode && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <QrCode className="h-4 w-4 text-muted-foreground" />
                <span>QR Code</span>
                <Badge
                  variant={table.qrCode.isActive ? "default" : "secondary"}
                  className="text-xs"
                >
                  {table.qrCode.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>

              {/* QR Code Modal Trigger */}
              <QRCodeModal table={table} organizationSlug={organizationSlug} />
            </div>

            {/* QR Code Stats */}
            <div className="text-xs text-muted-foreground">
              <div>Scans: {table.qrCode.scanCount}</div>
              {table.qrCode.lastScannedAt && (
                <div>
                  Last scan:{" "}
                  {new Date(table.qrCode.lastScannedAt).toLocaleDateString('en-US')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR Code Disabled State */}
        {!table.isQrEnabled && (
          <div className="border-t pt-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <QrCode className="h-4 w-4" />
              <span>QR Code disabled</span>
            </div>
            {canManageTable && (
              <p className="text-xs text-muted-foreground mt-1">
                Enable QR code in table settings
              </p>
            )}
          </div>
        )}

        {/* Management Actions for Admins/Owners */}
        {canManageTable && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex gap-2 text-xs">
              <span className="text-muted-foreground">
                Created: {table.createdAt.toLocaleDateString('en-US')}
              </span>
            </div>
            <Link href={`/dashboard/${organizationSlug}/tables/${table.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-3 w-3 mr-2" />
                View Details & Orders
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

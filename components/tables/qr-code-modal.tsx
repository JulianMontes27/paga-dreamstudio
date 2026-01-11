"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Dynamic import: Load QR code library only when modal opens (~40kb saved on initial load)
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    loading: () => (
      <div className="w-[200px] h-[200px] bg-muted animate-pulse rounded-lg" />
    ),
    ssr: false, // QR generation requires browser APIs
  }
);
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Eye,
  Download,
  Share2,
  Copy,
  QrCode,
  ExternalLink,
  Calendar,
  BarChart3,
} from "lucide-react";

/**
 * QR Code Modal Props Interface
 */
interface QRCodeModalProps {
  table: {
    id: string;
    tableNumber: string;
    capacity: number;
    section: string | null;
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
  organizationSlug: string;
}

/**
 * QR Code Modal Component - Client Component
 *
 * Displays QR code for table in a modal dialog with management options.
 * Features:
 * - Large QR code display for scanning
 * - Copy checkout URL functionality
 * - Download QR code as image
 * - QR code analytics (scan count, last scan)
 * - Print-friendly format
 *
 * This is a Client Component to handle user interactions and browser APIs.
 */
export function QRCodeModal({ table, organizationSlug }: QRCodeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Early return if no QR code exists
  if (!table.qrCode) {
    return null;
  }

  const qrCode = table.qrCode;

  /**
   * Copies the checkout URL to clipboard
   * Provides user feedback via toast notification
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode.checkoutUrl);
      toast.success("Checkout URL copied to clipboard");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy URL");
    }
  };

  /**
   * Downloads QR code as PNG image
   * Creates a canvas element and triggers download
   */
  const downloadQRCode = () => {
    try {
      // Get the SVG element
      const svg = document.querySelector('#qr-code-svg') as SVGElement;
      if (!svg) {
        toast.error("QR code not found");
        return;
      }

      // Create canvas and convert SVG to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // Set canvas size
      canvas.width = 300;
      canvas.height = 300;

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        ctx?.drawImage(img, 0, 0, 300, 300);

        // Create download link
        const link = document.createElement('a');
        link.download = `table-${table.tableNumber}-qr-code.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Cleanup
        URL.revokeObjectURL(url);
        toast.success("QR code downloaded");
      };

      img.src = url;
    } catch (error) {
      console.error("Failed to download QR code:", error);
      toast.error("Failed to download QR code");
    }
  };

  /**
   * Opens checkout URL in new tab
   */
  const openCheckoutUrl = () => {
    window.open(qrCode.checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  /**
   * Formats date for display
   */
  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString('en-US');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto my-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Table {table.tableNumber} QR Code
          </DialogTitle>
          <DialogDescription>
            Customers can scan this QR code to access the menu and place orders
            {table.section && ` for ${table.section}`}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* QR Code Display */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 flex flex-col items-center space-y-4">
                {/* QR Code SVG */}
                <div className="bg-white p-4 rounded-lg">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={qrCode.checkoutUrl}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>

                {/* QR Code Status */}
                <div className="text-center space-y-2">
                  <Badge variant={qrCode.isActive ? "default" : "secondary"}>
                    {qrCode.isActive ? "Active" : "Inactive"}
                  </Badge>

                  {qrCode.expiresAt && (
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Expires: {formatDate(qrCode.expiresAt)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="w-full"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy URL
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={openCheckoutUrl}
                className="w-full col-span-2"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview Checkout
              </Button>
            </div>
          </div>

          {/* QR Code Information & Analytics */}
          <div className="space-y-4">
            {/* Table Information */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Table Information</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Table Number:</span>
                    <span className="font-medium">{table.tableNumber}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="font-medium">{table.capacity} seats</span>
                  </div>

                  {table.section && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Section:</span>
                      <span className="font-medium">{table.section}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* QR Code Analytics */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  QR Code Analytics
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Scans:</span>
                    <span className="font-medium">{qrCode.scanCount}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Scanned:</span>
                    <span className="font-medium">
                      {formatDate(qrCode.lastScannedAt)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">QR Code ID:</span>
                    <span className="font-mono text-xs">{qrCode.code}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checkout URL */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Checkout URL</h3>

                <div className="bg-muted rounded-md p-2">
                  <code className="text-xs break-all">
                    {qrCode.checkoutUrl}
                  </code>
                </div>

                <p className="text-xs text-muted-foreground">
                  This URL redirects customers to the menu and ordering interface
                  for this specific table.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
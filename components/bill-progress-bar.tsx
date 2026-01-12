"use client";

import { CheckCircle, Circle, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PaymentClaim {
  id: string;
  claimedAmount: string;
  splitFeePortion: string;
  totalToPay: string;
  status: string;
  expiresAt: Date;
}

interface BillProgressProps {
  totalAmount: number;
  totalClaimed: number;
  totalPaid: number;
  availableAmount: number;
  percentPaid: number;
  claims: PaymentClaim[];
  isFullyPaid: boolean;
}

export function BillProgressBar({
  totalAmount,
  totalClaimed,
  totalPaid,
  availableAmount,
  percentPaid,
  claims,
  isFullyPaid,
}: BillProgressProps) {
  const paidClaims = claims.filter((c) => c.status === "paid");
  const processingClaims = claims.filter((c) => c.status === "processing");
  const reservedClaims = claims.filter((c) => c.status === "reserved");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">Bill Payment Status</h3>
        {isFullyPaid ? (
          <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
            Fully Paid
          </span>
        ) : (
          <span className="text-sm text-gray-600">
            {paidClaims.length} of {claims.length} paid
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={percentPaid} className="h-4" />
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {totalPaid.toLocaleString()} COP paid
          </span>
          <span className="font-medium">
            {percentPaid.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Amount Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total bill:</span>
          <span className="font-semibold">
            {totalAmount.toLocaleString()} COP
          </span>
        </div>
        {totalClaimed > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Currently claimed:</span>
            <span className="text-yellow-600 font-medium">
              {totalClaimed.toLocaleString()} COP
            </span>
          </div>
        )}
        {totalPaid > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Already paid:</span>
            <span className="text-green-600 font-medium">
              {totalPaid.toLocaleString()} COP
            </span>
          </div>
        )}
        {availableAmount > 0 && (
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-gray-900 font-medium">Still available:</span>
            <span className="text-blue-600 font-bold text-base">
              {availableAmount.toLocaleString()} COP
            </span>
          </div>
        )}
      </div>

      {/* Claims List */}
      {claims.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Payment Portions</h4>
          <div className="space-y-2">
            {claims.map((claim) => {
              const amount = parseFloat(claim.claimedAmount);
              const fee = parseFloat(claim.splitFeePortion);
              const total = parseFloat(claim.totalToPay);

              return (
                <div
                  key={claim.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    claim.status === "paid"
                      ? "bg-green-50 border-green-200"
                      : claim.status === "processing"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {claim.status === "paid" ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : claim.status === "processing" ? (
                      <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 animate-pulse" />
                    ) : claim.status === "reserved" ? (
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}

                    <div>
                      <div className="font-medium text-sm">
                        {claim.status === "paid" && "Paid"}
                        {claim.status === "processing" && "Processing payment..."}
                        {claim.status === "reserved" && "Reserved"}
                        {claim.status === "expired" && "Expired"}
                      </div>
                      <div className="text-xs text-gray-600">
                        {amount.toLocaleString()} COP
                        {fee > 0 && (
                          <span className="text-gray-500">
                            {" "}+ {fee.toLocaleString()} COP fee
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-sm">
                      {total.toLocaleString()} COP
                    </div>
                    {claim.status === "reserved" && (
                      <div className="text-xs text-gray-500">
                        Expires in {getRemainingTime(claim.expiresAt)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {isFullyPaid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">
            Bill fully paid! Thank you!
          </p>
        </div>
      )}

      {!isFullyPaid && processingClaims.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <p className="text-yellow-800">
              {processingClaims.length} payment{processingClaims.length > 1 ? "s" : ""} currently processing
            </p>
          </div>
        </div>
      )}

      {!isFullyPaid && reservedClaims.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-800">
              {reservedClaims.length} portion{reservedClaims.length > 1 ? "s" : ""} reserved by others
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Calculate remaining time for claim expiry
 */
function getRemainingTime(expiresAt: Date): string {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();

  if (diffMs <= 0) return "expired";

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffSeconds = Math.floor((diffMs % 60000) / 1000);

  if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds}s`;
  }
  return `${diffSeconds}s`;
}

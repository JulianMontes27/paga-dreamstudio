"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Clock, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PaymentAmountSelectorProps {
  totalAmount: number;
  availableAmount: number;
  totalClaimed: number;
  onAmountSelected: (amount: number) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function PaymentAmountSelector({
  totalAmount,
  availableAmount,
  totalClaimed,
  onAmountSelected,
  onCancel,
  isLoading = false,
}: PaymentAmountSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<
    "full" | "half" | "quarter" | "custom" | null
  >(null);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState("");

  const FIXED_FEE = 800; // COP per transaction

  // Calculate split fee for the selected amount
  const getSelectedAmount = () => {
    switch (selectedMode) {
      case "full":
        return availableAmount;
      case "half":
        return Math.floor(availableAmount / 2);
      case "quarter":
        return Math.floor(availableAmount / 4);
      case "custom":
        return parseFloat(customAmount) || 0;
      default:
        return 0;
    }
  };

  const selectedAmount = getSelectedAmount();

  // Calculate proportional transaction fee (same as server-side logic)
  // IMPORTANT: Check against ORIGINAL bill, not available amount
  // - Paying 100% of ORIGINAL BILL → no fee (baseline, single transaction)
  // - Paying < 100% of ORIGINAL BILL → proportional fee (splitting cost)
  // This ensures fairness: if 2 people split 50/50, BOTH pay 50% of fee
  const isPayingFullBill = selectedAmount >= totalAmount;
  const proportionalFee = isPayingFullBill
    ? 0
    : selectedAmount > 0
      ? (selectedAmount / totalAmount) * FIXED_FEE
      : 0;
  const totalToPay = selectedAmount + proportionalFee;

  const percentOfBill = (selectedAmount / totalAmount) * 100;
  const percentClaimed = (totalClaimed / totalAmount) * 100;

  const handleContinue = () => {
    setError("");

    if (!selectedMode) {
      setError("Please select an amount");
      return;
    }

    if (selectedAmount <= 0) {
      setError("Amount must be greater than zero");
      return;
    }

    if (selectedAmount > availableAmount) {
      setError(`Maximum available is ${availableAmount.toLocaleString()} COP`);
      return;
    }

    onAmountSelected(selectedAmount);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setError("");

    const amount = parseFloat(value);
    if (amount > availableAmount) {
      setError(`Maximum available is ${availableAmount.toLocaleString()} COP`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">How much would you like to pay?</h2>
        <p className="text-gray-600 mt-1">
          Choose an amount or enter a custom value
        </p>
      </div>

      {/* Availability Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-blue-900 font-medium">
                Bill Status
              </span>
              <span className="text-2xl font-bold text-blue-900">
                {availableAmount.toLocaleString()} COP
              </span>
            </div>

            {totalClaimed > 0 && (
              <>
                <Progress value={percentClaimed} className="mb-2 bg-blue-100" />
                <div className="flex justify-between text-xs text-blue-700">
                  <span>
                    {totalClaimed.toLocaleString()} COP claimed by others
                  </span>
                  <span>{percentClaimed.toFixed(0)}% of bill</span>
                </div>
              </>
            )}

            <div className="text-sm text-blue-900 mt-2">
              <span className="font-medium">Available:</span>{" "}
              {availableAmount.toLocaleString()} COP
            </div>
          </div>
        </div>
      </div>

      {/* Quick Amount Options */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Quick Options</Label>

        <div className="grid grid-cols-2 gap-3">
          {/* Full Amount */}
          <button
            onClick={() => {
              setSelectedMode("full");
              setError("");
            }}
            disabled={isLoading}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedMode === "full"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="font-semibold text-lg">
              {availableAmount.toLocaleString()} COP
            </div>
            <div className="text-sm text-gray-600">Full remaining amount</div>
          </button>

          {/* Half Amount */}
          <button
            onClick={() => {
              setSelectedMode("half");
              setError("");
            }}
            disabled={isLoading}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedMode === "half"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="font-semibold text-lg">
              {Math.floor(availableAmount / 2).toLocaleString()} COP
            </div>
            <div className="text-sm text-gray-600">Half of available</div>
          </button>

          {/* Quarter Amount */}
          {availableAmount >= 4000 && (
            <button
              onClick={() => {
                setSelectedMode("quarter");
                setError("");
              }}
              disabled={isLoading}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedMode === "quarter"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="font-semibold text-lg">
                {Math.floor(availableAmount / 4).toLocaleString()} COP
              </div>
              <div className="text-sm text-gray-600">Quarter of available</div>
            </button>
          )}

          {/* Custom Amount */}
          <button
            onClick={() => {
              setSelectedMode("custom");
              setError("");
            }}
            disabled={isLoading}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedMode === "custom"
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="font-semibold text-lg">Custom</div>
            <div className="text-sm text-gray-600">Enter your own amount</div>
          </button>
        </div>

        {/* Custom Amount Input */}
        {selectedMode === "custom" && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <Label htmlFor="custom-amount" className="text-sm font-medium">
              Enter amount (COP)
            </Label>
            <Input
              id="custom-amount"
              type="number"
              min="1000"
              max={availableAmount}
              step="1000"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder={`Up to ${availableAmount.toLocaleString()}`}
              className="mt-2 text-lg font-semibold"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-2">
              Minimum: 1,000 COP · Maximum: {availableAmount.toLocaleString()}{" "}
              COP
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Payment Summary */}
      {selectedMode && selectedAmount > 0 && !error && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold">Payment Summary</h3>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Your portion:</span>
              <span className="font-medium">
                {selectedAmount.toLocaleString()} COP
              </span>
            </div>

            {proportionalFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Convenience fee:</span>
                <span className="text-gray-600">
                  +{Math.round(proportionalFee).toLocaleString()} COP
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs text-gray-500">
              <span>({percentOfBill.toFixed(1)}% of total bill)</span>
            </div>

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total to pay:</span>
              <span className="text-blue-600">
                {Math.round(totalToPay).toLocaleString()} COP
              </span>
            </div>
          </div>

          {proportionalFee > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <p>
                  Since you&apos;re splitting the bill, a small convenience fee is added
                  to cover the extra transaction costs. Paying the full amount has
                  no extra fees!
                </p>
              </div>
            </div>
          )}

          {/* Reservation Timer Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800">
            <div className="flex items-start gap-2">
              <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <p>
                This amount will be reserved for 5 minutes while you complete
                the payment
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleContinue}
          disabled={!selectedMode || selectedAmount <= 0 || isLoading || !!error}
          className="flex-1"
        >
          {isLoading ? "Processing..." : "Continue to Payment"}
        </Button>
      </div>
    </div>
  );
}

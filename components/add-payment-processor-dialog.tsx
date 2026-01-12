"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, ExternalLink, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { StripeLogo } from "@/components/logos";
import Image from "next/image";

/**
 * Dialog component for adding a new payment processor
 */
export default function AddPaymentProcessorDialog({
  organizationId,
  mpOauthUrl,
}: {
  organizationId: string;
  mpOauthUrl: string;
}) {
  const [connecting, setConnecting] = useState<string | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Payment Processor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-2">
          <DialogTitle>Connect Payment Processor</DialogTitle>
          <DialogDescription>
            Choose a payment processor to start accepting customer payments
            securely.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-2">
          <div className="space-y-4">
            {/* Stripe Option */}
            <div className="group relative overflow-hidden border rounded-xl hover:border-accent transition-all duration-200 hover:shadow-md">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 flex items-center justify-center">
                      <StripeLogo className="h-8 w-auto" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold">Stripe</div>
                      <div className="text-sm text-muted-foreground">
                        Global payment processing platform with advanced
                        features
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>PCI Compliant</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>Instant Setup</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={connecting !== null}
                    className="min-w-[80px]"
                  >
                    {connecting === "stripe" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* MercadoPago Option */}
            <div className="group relative overflow-hidden border rounded-xl hover:border-accent transition-all duration-200 hover:shadow-md">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 flex items-center justify-center">
                      <Image
                        src="/MP_RGB_HANDSHAKE_color_vertical.svg"
                        alt="MercadoPago"
                        width={48}
                        height={48}
                        className="h-10 w-auto"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold">MercadoPago</div>
                      <div className="text-sm text-muted-foreground">
                        Leading payment solution in Latin America
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>Bank Security</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>Local Support</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Link href={mpOauthUrl}>
                    <Button size="sm" className="min-w-[80px]">
                      {connecting === "mercadopago" ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          Connect
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Toast POS Option */}
            <div className="group relative overflow-hidden border rounded-xl hover:border-accent transition-all duration-200 hover:shadow-md">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 flex items-center justify-center">
                      <Image
                        src="/Toast POS.svg"
                        alt="Toast POS"
                        width={48}
                        height={48}
                        className="h-10 w-auto"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold">Toast POS</div>
                      <div className="text-sm text-muted-foreground">
                        Restaurant-focused point-of-sale system
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          <span>POS Integration</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>Restaurant Focus</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={connecting !== null}
                    className="min-w-[80px]"
                  >
                    {connecting === "toast" ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PaymentResultActionsProps {
  qrCode: string;
  showEmailForm?: boolean;
  receiptData?: {
    paymentId?: string;
    orderNumber?: string;
    amount?: number;
    currency?: string;
    organizationName: string;
    status: "success" | "pending" | "failure";
  };
}

export function PaymentResultActions({
  qrCode,
  showEmailForm = true,
  receiptData,
}: PaymentResultActionsProps) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReceipt = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast.error("Por favor ingresa un correo válido");
      return;
    }

    setSending(true);

    try {
      const response = await fetch(`/api/checkout/${qrCode}/send-receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...receiptData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSent(true);
        toast.success("Recibo enviado a tu correo");
      } else {
        toast.error(data.message || "Error al enviar el recibo");
      }
    } catch (error) {
      console.error("Error sending receipt:", error);
      toast.error("Error al enviar el recibo");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4 mt-6">
      {/* Email Receipt Form */}
      {showEmailForm && receiptData && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-700">
              Recibir comprobante por correo
            </h3>
          </div>

          {sent ? (
            <div className="flex items-center gap-2 text-green-600 py-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                Recibo enviado a {email}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSendReceipt} className="space-y-3">
              <Input
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base"
                disabled={sending}
              />
              <Button
                type="submit"
                variant="outline"
                className="w-full h-12 text-base font-medium"
                disabled={sending || !email}
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Recibo
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Recibirás un comprobante con los detalles de tu pago
              </p>
            </form>
          )}
        </div>
      )}

      {/* Back to Table Button */}
      <Link href={`/checkout/${qrCode}`} className="block">
        <Button
          variant="default"
          className="w-full h-14 text-base font-semibold rounded-xl"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a la Mesa
        </Button>
      </Link>
      <p className="text-xs text-center text-muted-foreground">
        Regresa al menú para seguir ordenando o ver el estado de tu pedido
      </p>
    </div>
  );
}

import { notFound } from "next/navigation";
import { db } from "@/db";
import { qrCode, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyMercadopagoPayment } from "@/lib/payment-verification";
import {
  getOrderByPaymentId,
  getOrderByPreferenceId,
} from "@/server/orders";
import { getActivePaymentProcessorWithToken } from "@/server/payment-processors";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { PaymentResultActions } from "@/components/payment-result-actions";

interface SuccessPageProps {
  params: Promise<{ qrCode: string }>;
  searchParams: Promise<{
    payment_id?: string;
    status?: string;
    external_reference?: string;
    preference_id?: string;
    collection_status?: string;
  }>;
}

/**
 * Success Page Handler
 *
 * This page is shown after a successful payment redirect from Mercadopago
 * IMPORTANT: We verify the payment server-side, never trust URL params
 */
export default async function SuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { qrCode: qrCodeParam } = await params;
  const {
    payment_id,
    preference_id,
    external_reference,
  } = await searchParams;

  // Validate QR code
  const qrCodeData = await db
    .select({
      qrCode: qrCode,
      organization: organization,
    })
    .from(qrCode)
    .innerJoin(organization, eq(organization.id, qrCode.organizationId))
    .where(eq(qrCode.code, qrCodeParam))
    .limit(1);

  if (!qrCodeData.length) {
    notFound();
  }

  const { organization: org } = qrCodeData[0];

  // SECURITY: Verify the payment server-side
  // NEVER trust the status from URL params - anyone could manipulate them

  if (!payment_id) {
    return (
      <PaymentResultPage
        status="error"
        title="Información de Pago Faltante"
        message="No pudimos encontrar la información del pago. Por favor contacta a soporte si se realizó algún cargo."
        organizationName={org.name}
        qrCode={qrCodeParam}
      />
    );
  }

  // Get the payment processor for this organization
  const paymentProcessor = await getActivePaymentProcessorWithToken(org.id);

  if (!paymentProcessor || paymentProcessor.processorType !== "mercadopago") {
    return (
      <PaymentResultPage
        status="error"
        title="Error de Configuración"
        message="El procesador de pagos no está configurado correctamente. Por favor contacta a soporte."
        organizationName={org.name}
        qrCode={qrCodeParam}
      />
    );
  }

  // Verify the payment with Mercadopago API (the SECURE way)
  const verification = await verifyMercadopagoPayment(
    payment_id,
    paymentProcessor.accessToken
  );

  if (verification.error) {
    return (
      <PaymentResultPage
        status="error"
        title="Verificación de Pago Fallida"
        message={`No pudimos verificar tu pago: ${verification.error}. Por favor contacta a soporte.`}
        organizationName={org.name}
        paymentId={payment_id}
        qrCode={qrCodeParam}
      />
    );
  }

  // Find the order by payment ID or external reference
  let order = await getOrderByPaymentId(payment_id);
  let isClaimPayment = false;

  if (!order && external_reference) {
    // Try to find by external reference - could be claim ID or order ID
    const { getPaymentClaimById } = await import("@/server/payment-claims");
    const claim = await getPaymentClaimById(external_reference);

    if (claim) {
      // This is a claim-based (split) payment
      isClaimPayment = true;

      const { getOrderById } = await import("@/server/orders");
      order = await getOrderById(claim.orderId);
    } else {
      // Try to find order directly by ID
      const { getOrderById } = await import("@/server/orders");
      order = await getOrderById(external_reference);
    }
  }

  if (!order && preference_id) {
    // Try to find by preference ID
    order = await getOrderByPreferenceId(preference_id);
  }

  if (!order) {
    return (
      <PaymentResultPage
        status="warning"
        title="Pedido No Encontrado"
        message="El pago fue procesado pero no pudimos encontrar tu pedido. Por favor contacta a soporte con tu ID de pago."
        organizationName={org.name}
        paymentId={payment_id}
        qrCode={qrCodeParam}
      />
    );
  }

  // NOTE: We DO NOT update the order status here
  // The webhook is responsible for updating order status
  // This page only verifies payment for display purposes
  //
  // Why? Because:
  // 1. Webhooks are the official, secure notification from MercadoPago
  // 2. Success pages can be refreshed multiple times (causing duplicate updates)
  // 3. Users can reach this page before webhook fires (race condition)
  // 4. The webhook will always fire, even if user closes browser

  // Show result based on actual payment status (not URL params)
  if (verification.success) {
    const totalPaid = parseFloat(order.totalPaid || "0");
    const totalAmount = parseFloat(order.totalAmount);
    const isFullyPaid = totalPaid >= totalAmount;

    let successMessage = "Tu pago ha sido procesado exitosamente. ¡Gracias por tu pedido!";

    // Use verification.amount which includes convenience fees
    const paidAmount = verification.amount;

    if (isClaimPayment && !isFullyPaid) {
      successMessage = `Tu pago de $${paidAmount?.toLocaleString()} ${verification.currency} ha sido procesado. Saldo restante: $${(totalAmount - totalPaid).toLocaleString()} ${verification.currency}.`;
    } else if (isClaimPayment && isFullyPaid) {
      successMessage = `Tu pago de $${paidAmount?.toLocaleString()} ${verification.currency} ha sido procesado. ¡La cuenta está completamente pagada!`;
    }

    return (
      <PaymentResultPage
        status="success"
        title="¡Pago Exitoso!"
        message={successMessage}
        organizationName={org.name}
        paymentId={payment_id}
        orderNumber={order.orderNumber}
        amount={verification.amount}
        currency={verification.currency}
        qrCode={qrCodeParam}
      />
    );
  } else if (verification.status === "pending" || verification.status === "in_process") {
    return (
      <PaymentResultPage
        status="pending"
        title="Pago Pendiente"
        message="Tu pago está siendo procesado. Recibirás una confirmación pronto."
        organizationName={org.name}
        paymentId={payment_id}
        orderNumber={order.orderNumber}
        qrCode={qrCodeParam}
      />
    );
  } else {
    return (
      <PaymentResultPage
        status="error"
        title="Pago No Completado"
        message={`Estado del pago: ${verification.status}. Por favor intenta de nuevo o contacta a soporte.`}
        organizationName={org.name}
        paymentId={payment_id}
        qrCode={qrCodeParam}
      />
    );
  }
}

/**
 * Payment Result Display Component
 */
function PaymentResultPage({
  status,
  title,
  message,
  organizationName,
  paymentId,
  orderNumber,
  amount,
  currency,
  qrCode,
}: {
  status: "success" | "error" | "warning" | "pending";
  title: string;
  message: string;
  organizationName: string;
  paymentId?: string;
  orderNumber?: string;
  amount?: number;
  currency?: string;
  qrCode: string;
}) {
  const statusConfig = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      borderColor: "border-green-200",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
    },
    warning: {
      icon: AlertTriangle,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      borderColor: "border-yellow-200",
    },
    pending: {
      icon: Clock,
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  const showEmailForm = status === "success" || status === "pending";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div
          className={`${config.bgColor} ${config.borderColor} border-2 rounded-2xl p-5 text-center`}
        >
          <div className="flex justify-center mb-3">
            <Icon className={`h-14 w-14 ${config.iconColor}`} />
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-sm text-gray-700 mb-5">{message}</p>

          <div className="bg-white rounded-xl p-4 mb-4 text-left">
            <h2 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Detalles del Pago
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Restaurante:</span>
                <span className="font-medium text-gray-900">
                  {organizationName}
                </span>
              </div>

              {orderNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Orden:</span>
                  <span className="font-medium text-gray-900">
                    #{orderNumber}
                  </span>
                </div>
              )}

              {amount && currency && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="font-semibold text-gray-900">
                    ${amount.toLocaleString()} {currency}
                  </span>
                </div>
              )}

              {paymentId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ID:</span>
                  <span className="font-mono text-xs text-gray-500">
                    {paymentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {status === "success" && (
            <p className="text-sm text-gray-600 mb-2">
              Tu pedido será preparado en breve. ¡Gracias!
            </p>
          )}

          {status === "error" && (
            <p className="text-sm text-gray-600 mb-2">
              Si necesitas ayuda, muestra este ID de pago al personal del
              restaurante.
            </p>
          )}

          {/* Email Receipt & Back Button */}
          <PaymentResultActions
            qrCode={qrCode}
            showEmailForm={showEmailForm}
            receiptData={{
              paymentId,
              orderNumber,
              amount,
              currency,
              organizationName,
              status: status === "success" ? "success" : status === "pending" ? "pending" : "failure",
            }}
          />
        </div>
      </div>
    </div>
  );
}

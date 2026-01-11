import { notFound } from "next/navigation";
import { db } from "@/db";
import { qrCode, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cancelPaymentClaim } from "@/server/payment-claims";

interface FailurePageProps {
  params: Promise<{ qrCode: string }>;
  searchParams: Promise<{
    payment_id?: string;
    status?: string;
    external_reference?: string;
    preference_id?: string;
  }>;
}

/**
 * Payment Failure Page
 *
 * Shown when a payment is rejected or fails
 */
export default async function FailurePage({
  params,
  searchParams,
}: FailurePageProps) {
  const { qrCode: qrCodeParam } = await params;
  const { payment_id, external_reference } = await searchParams;

  // Cancel the payment claim if we have the claim ID (external_reference)
  // This allows the user to try again immediately without waiting for expiry
  if (external_reference) {
    try {
      await cancelPaymentClaim(external_reference);
    } catch (error) {
      // Silently ignore errors - claim might already be cancelled/expired
      console.error("Error cancelling claim on failure page:", error);
    }
  }

  // Get organization info
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 sm:p-8 text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pago Fallido
          </h1>
          <p className="text-gray-700 mb-6">
            Tu pago no pudo ser procesado. No se realizó ningún cargo a tu
            cuenta.
          </p>

          <div className="bg-white rounded-xl p-4 mb-4 text-left">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              Detalles
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Restaurante:</span>
                <span className="font-medium text-gray-900">{org.name}</span>
              </div>

              {payment_id && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Pago:</span>
                  <span className="font-mono text-xs text-gray-900">
                    {payment_id}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Razones comunes del fallo:</p>
              <ul className="text-left space-y-1 pl-4">
                <li>• Fondos insuficientes</li>
                <li>• Tarjeta vencida o inválida</li>
                <li>• El banco rechazó la transacción</li>
                <li>• El pago fue cancelado</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600">
              Si continúas teniendo problemas, por favor habla con el personal
              del restaurante.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link href={`/checkout/${qrCodeParam}`} className="block">
              <Button
                className="w-full h-14 text-base font-semibold rounded-xl"
              >
                <RefreshCw className="h-5 w-5 mr-2" />
                Intentar de Nuevo
              </Button>
            </Link>
            <p className="text-xs text-center text-muted-foreground">
              Regresa al menú para intentar el pago nuevamente
            </p>

            <div className="pt-2">
              <Link href={`/checkout/${qrCodeParam}`} className="block">
                <Button
                  variant="outline"
                  className="w-full h-12 text-base font-medium rounded-xl"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a la Mesa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

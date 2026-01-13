// import { notFound } from "next/navigation";
// import { db } from "@/db";
// import { qrCode, organization } from "@/db/schema";
// import { eq } from "drizzle-orm";
// import { Clock, RefreshCw } from "lucide-react";
// import { PaymentResultActions } from "@/components/payment-result-actions";

// interface PendingPageProps {
//   params: Promise<{ qrCode: string }>;
//   searchParams: Promise<{
//     payment_id?: string;
//     status?: string;
//     external_reference?: string;
//   }>;
// }

// /**
//  * Payment Pending Page
//  *
//  * Shown when a payment is being processed or requires additional action
//  */
// export default async function PendingPage({
//   params,
//   searchParams,
// }: PendingPageProps) {
//   const { qrCode: qrCodeParam } = await params;
//   const { payment_id, external_reference } = await searchParams;

//   // Get organization info
//   const qrCodeData = await db
//     .select({
//       qrCode: qrCode,
//       organization: organization,
//     })
//     .from(qrCode)
//     .innerJoin(organization, eq(organization.id, qrCode.organizationId))
//     .where(eq(qrCode.code, qrCodeParam))
//     .limit(1);

//   if (!qrCodeData.length) {
//     notFound();
//   }

//   const { organization: org } = qrCodeData[0];

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
//       <div className="max-w-md w-full">
//         <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 sm:p-8 text-center">
//           <div className="flex justify-center mb-4">
//             <div className="relative">
//               <Clock className="h-16 w-16 text-blue-600" />
//               <RefreshCw className="h-6 w-6 text-blue-600 absolute -bottom-1 -right-1 animate-spin" />
//             </div>
//           </div>

//           <h1 className="text-2xl font-bold text-gray-900 mb-2">
//             Pago Pendiente
//           </h1>
//           <p className="text-gray-700 mb-6">
//             Tu pago está siendo procesado. Esto puede tardar unos momentos.
//           </p>

//           <div className="bg-white rounded-xl p-4 mb-4 text-left">
//             <h2 className="text-sm font-semibold text-gray-600 mb-3">
//               Detalles
//             </h2>

//             <div className="space-y-2 text-sm">
//               <div className="flex justify-between">
//                 <span className="text-gray-600">Restaurante:</span>
//                 <span className="font-medium text-gray-900">{org.name}</span>
//               </div>

//               {payment_id && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">ID de Pago:</span>
//                   <span className="font-mono text-xs text-gray-900">
//                     {payment_id}
//                   </span>
//                 </div>
//               )}

//               {external_reference && (
//                 <div className="flex justify-between">
//                   <span className="text-gray-600">ID de Orden:</span>
//                   <span className="font-mono text-xs text-gray-900">
//                     {external_reference}
//                   </span>
//                 </div>
//               )}
//             </div>
//           </div>

//           <div className="space-y-4 mb-4">
//             <div className="bg-blue-100 border border-blue-300 rounded-xl p-4 text-sm text-blue-900">
//               <p className="font-medium mb-2">¿Qué sucede ahora?</p>
//               <ul className="text-left space-y-1 pl-4">
//                 <li>• Tu pago está siendo verificado</li>
//                 <li>• Recibirás una confirmación pronto</li>
//                 <li>• No es necesario realizar otro pago</li>
//               </ul>
//             </div>

//             <div className="text-sm text-gray-600">
//               <p className="mb-2">Razones comunes del estado pendiente:</p>
//               <ul className="text-left space-y-1 pl-4">
//                 <li>• El banco está verificando la transacción</li>
//                 <li>• Se requiere autenticación adicional</li>
//                 <li>• Retraso en el procesamiento (normalmente se resuelve en minutos)</li>
//               </ul>
//             </div>

//             <div className="pt-4 border-t border-blue-200">
//               <p className="text-sm text-gray-600">
//                 Por favor guarda este número de referencia. Si no recibes
//                 confirmación en 10 minutos, habla con el personal del
//                 restaurante.
//               </p>
//             </div>
//           </div>

//           {/* Email Receipt & Back Button */}
//           <PaymentResultActions
//             qrCode={qrCodeParam}
//             showEmailForm={true}
//             receiptData={{
//               paymentId: payment_id,
//               organizationName: org.name,
//               status: "pending",
//             }}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

export default function PendingPage() {
  return <div>Payment pending page - coming soon</div>;
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qrCode, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY as string);

interface SendReceiptRequest {
  email: string;
  paymentId?: string;
  orderNumber?: string;
  amount?: number;
  currency?: string;
  organizationName: string;
  status: "success" | "pending" | "failure";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ qrCode: string }> }
) {
  try {
    const { qrCode: qrCodeParam } = await params;
    const body: SendReceiptRequest = await request.json();

    const { email, paymentId, orderNumber, amount, currency, organizationName, status } = body;

    // Validate email
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Correo electrónico inválido" },
        { status: 400 }
      );
    }

    // Verify QR code exists
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
      return NextResponse.json(
        { success: false, message: "Código QR no encontrado" },
        { status: 404 }
      );
    }

    const { organization: org } = qrCodeData[0];

    // Generate email content based on status
    const statusText = {
      success: "Pago Exitoso",
      pending: "Pago Pendiente",
      failure: "Pago Fallido",
    };

    const statusEmoji = {
      success: "✅",
      pending: "⏳",
      failure: "❌",
    };

    const statusColor = {
      success: "#22c55e",
      pending: "#3b82f6",
      failure: "#ef4444",
    };

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comprobante de Pago - ${org.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 480px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background-color: ${statusColor[status]}; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">${statusEmoji[status]}</div>
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
                ${statusText[status]}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 18px; font-weight: 600;">
                Detalles del Pago
              </h2>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Restaurante</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #111827; font-size: 14px; font-weight: 600;">${organizationName}</span>
                  </td>
                </tr>
                ${orderNumber ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Número de Orden</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #111827; font-size: 14px; font-weight: 600;">${orderNumber}</span>
                  </td>
                </tr>
                ` : ""}
                ${amount && currency ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-size: 14px;">Monto</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #111827; font-size: 18px; font-weight: 700;">${currency} $${amount.toFixed(2)}</span>
                  </td>
                </tr>
                ` : ""}
                ${paymentId ? `
                <tr>
                  <td style="padding: 12px 0;">
                    <span style="color: #6b7280; font-size: 14px;">ID de Pago</span>
                  </td>
                  <td style="padding: 12px 0; text-align: right;">
                    <span style="color: #6b7280; font-size: 12px; font-family: monospace;">${paymentId}</span>
                  </td>
                </tr>
                ` : ""}
              </table>

              <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px;">
                <p style="margin: 0; color: #6b7280; font-size: 13px; text-align: center;">
                  ${status === "success"
                    ? "Gracias por tu pago. ¡Esperamos verte pronto!"
                    : status === "pending"
                      ? "Tu pago está siendo procesado. Te notificaremos cuando se complete."
                      : "Si tienes alguna pregunta, por favor contacta al restaurante."}
                </p>
              </div>

              <div style="margin-top: 24px; text-align: center;">
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  Fecha: ${new Date().toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Este es un comprobante generado automáticamente por Tip
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Send email
    await resend.emails.send({
      from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
      to: email,
      subject: `${statusEmoji[status]} Comprobante de Pago - ${org.name}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending receipt email:", error);
    return NextResponse.json(
      { success: false, message: "Error al enviar el correo" },
      { status: 500 }
    );
  }
}

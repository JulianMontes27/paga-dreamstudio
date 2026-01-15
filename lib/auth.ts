import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import {
  admin,
  anonymous,
  phoneNumber,
  emailOTP,
  organization,
} from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { openAPI } from "better-auth/plugins";
import { Resend } from "resend";
import twilio from "twilio";
import { schema } from "@/db";
import OrganizationInvitationEmail from "@/components/email-organization-invitation";
import { ac, administrator, waiter, owner } from "@/lib/auth-permissions";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcrypt";
// import ForgotPasswordEmail from "@/components/email-reset-password";
// import { sendMagicLinkEmail } from "./helpers/email";

// Initialize Resend lazily
const resend = new Resend(process.env.RESEND_API_KEY as string);

// Initialize Twilio lazily
const getTwilioClient = () =>
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),

  trustedOrigins: [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    "http://localhost:3000",
    "http://192.168.0.7:3000",
  ].filter(Boolean),

  // Server-side requests made using auth.api aren't affected by rate limiting. Rate limits only apply to client-initiated requests.
  // Rate limiting is disabled in development mode by default. In order to enable it, set enabled to true:
  // Rate limiting uses the connecting IP address to track the number of requests made by a user.
  // Rate limiting uses the connecting IP address to track the number of requests made by a user. The default header checked is x-forwarded-for, which is commonly used in production environments. If you are using a different header to track the user's IP address, you'll need to specify it.
  // By default, rate limit data is stored in memory, which may not be suitable for many use cases, particularly in serverless environments. To address this, you can use a database, secondary storage, or custom storage for storing rate limit data.
  rateLimit: {
    enabled: true,
    window: 60, // time window in seconds
    max: 100, // max requests in the window
  },

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },

    sendResetPassword: async ({ user, url }) => {
      console.log(`📧 Sending password reset email to ${user.email}`);
      resend.emails
        .send({
          from: process.env.FROM_EMAIL!,
          to: user.email,
          subject: "Restablece tu contraseña",
          html: `<p>Hola ${user.name}, haz clic aquí para restablecer: <a href="${url}">${url}</a></p>`,
        })
        .then((result) => {
          console.log(`✅ Password reset email sent to ${user.email}`, result);
        })
        .catch((error) => {
          console.error(
            `❌ Failed to send password reset email to ${user.email}:`,
            error
          );
        });
    },

    onPasswordReset: async ({ user }) => {
      console.log(`✅ Password for user ${user.email} has been reset.`);
    },
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  plugins: [
    admin(),
    anonymous(),
    nextCookies(),
    openAPI(),

    emailOTP({
      async sendVerificationOTP({ email, otp, type }, request) {
        let subject: string;
        let html: string;

        if (type === "sign-in") {
          subject = `Código de Acceso - ${otp}`;

          // Check if we need to also send SMS with the same code
          let phoneNumber = null;

          // Skip serializing full request object to avoid circular reference errors
          // console.log(
          //   "🔍 Debug - Full request object:",
          //   JSON.stringify(request, null, 2)
          // );

          try {
            // Try multiple ways to extract phone number
            if (request && request.body) {
              console.log("🔍 Debug - Request body:", request.body);
              const body =
                typeof request.body === "string"
                  ? JSON.parse(request.body)
                  : request.body;
              console.log("🔍 Debug - Parsed body:", body);
              phoneNumber = body.phoneNumber;
            }

            // Also check headers, URL params, etc.
            if (!phoneNumber && request) {
              console.log("🔍 Debug - Request keys:", Object.keys(request));
              if (request.headers && request.headers.get) {
                console.log("🔍 Debug - Headers:", request.headers);
                // Try to get the phone number from headers using the get method
                phoneNumber =
                  request.headers.get("x-phone-number") ||
                  request.headers.get("X-Phone-Number");
                console.log(
                  "🔍 Debug - Extracted phoneNumber from headers:",
                  phoneNumber
                );
              }
              // Note: URL parsing removed - GenericEndpointContext doesn't expose url property
              // Phone number should be passed via body or headers instead
            }
          } catch (e) {
            console.log("🔍 Debug - Error extracting phone:", e);
            console.log(
              "Could not extract phone number from request, skipping SMS"
            );
          }

          console.log("🔍 Debug - Final phoneNumber:", phoneNumber);

          // Send SMS with the same OTP code if we have the phone number
          if (phoneNumber) {
            try {
              // Check if phone number is already verified by another user
              const existingVerifiedUser = await db
                .select()
                .from(schema.user)
                .where(
                  and(
                    eq(schema.user.phoneNumber, phoneNumber),
                    eq(schema.user.phoneNumberVerified, true)
                  )
                )
                .limit(1);

              if (existingVerifiedUser.length > 0) {
                console.log(
                  `🚫 Phone number ${phoneNumber} is already verified by another user, skipping SMS`
                );
                // Don't send SMS to verified phone numbers owned by other users
                return;
              }

              console.log(
                `📱 Also sending email OTP code to SMS ${phoneNumber}: ${otp}`
              );

              const message = await getTwilioClient().messages.create({
                body: `Tu código de verificación Hunt Tickets: ${otp}. Válido por 5 minutos. No compartas este código.`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phoneNumber,
              });

              console.log(
                `✅ SMS also sent successfully. Message SID: ${message.sid}`
              );
            } catch (smsError) {
              console.error(
                `⚠️ Failed to send SMS to ${phoneNumber}:`,
                smsError
              );
              // Don't fail the entire process if SMS fails, email is the primary method
            }
          }

          html = `
<!DOCTYPE HTML PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>🔐 Tu código de verificación - Hunt Tickets</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap');
    * {
      font-family: 'Source Sans 3', Helvetica, Arial, sans-serif;
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      background-color: #f0f0f0;
      color: #2D2D2D;
    }
    table, td {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
      max-width: 100%;
    }
    p {
      margin: 0 0 12px 0;
      line-height: 1.6;
      font-weight: 400;
    }
    .otp-container {
      background: linear-gradient(135deg, #000000 0%, #2a2a2a 100%);
      border-radius: 16px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }
    .otp-code {
      background-color: #ffffff;
      color: #000000;
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 10px;
      padding: 20px 30px;
      border-radius: 8px;
      display: inline-block;
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
      margin: 15px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .timer-text {
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      opacity: 0.9;
    }
    .social-icon {
      display: inline-block;
      margin: 0 8px;
    }
    @media only screen and (max-width: 640px) {
      .wrapper-table {
        width: 100% !important;
      }
      .main-container {
        width: 100% !important;
        margin: 0 !important;
      }
      .mobile-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
      }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      font-family: Arial, sans-serif !important;
    }
    .otp-code {
      font-family: Courier New, monospace !important;
    }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f0f0f0; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif; color: #2D2D2D;">
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    Tu código de verificación es: ${otp}. No lo compartas con nadie. Válido por 10 minutos.
  </div>
  
  <!-- Wrapper table -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapper-table" style="background-color: #f0f0f0; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 30px 15px;">
        <!-- Email Container -->
        <!--[if mso]>
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="width: 600px;">
        <tr>
        <td>
        <![endif]-->
        <table class="main-container" align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
          <!-- Header with gradient -->
          <tr>
            <td style="padding: 0;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 30px 20px;">
                    <img src="https://jtfcfsnksywotlbsddqb.supabase.co/storage/v1/object/public/default/hunt_logo.png" alt="Hunt Tickets" width="140" height="46" style="display: block; border: 0; max-width: 140px; height: auto;">
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="mobile-padding" style="padding: 40px 45px 20px 45px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <!-- Welcome message -->
                    <p style="margin: 0 0 30px 0; font-size: 18px; line-height: 1.6; color: #333333; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif; text-align: center;">
                      Hola, aquí está tu código de verificación para crear tu cuenta Hunt Tickets
                    </p>
                    ${
                      phoneNumber
                        ? `<p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #666666; text-align: center;">
                      📧 Enviado por email • 📱 También enviado por SMS a ${phoneNumber}
                    </p>`
                        : ""
                    }
                    
                    <!-- OTP Section Minimalista -->
                    <div style="margin: 20px 0 30px 0;">
                      <div style="background-color: #f8f8f8; border: 1px solid #cccccc; border-radius: 12px; padding: 30px 20px; text-align: center;">
                        <p style="margin: 0 0 15px 0; font-size: 14px; color: #666666; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Código de verificación</p>
                        <div style="font-size: 42px; font-weight: 700; letter-spacing: 12px; color: #000000; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif; margin: 0 0 15px 0;">${otp}</div>
                        <p style="margin: 0; font-size: 14px; color: #666666;">Válido por 10 minutos</p>
                      </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; text-align: left;">
                      <p style="margin: 0 0 8px 0; font-size: 15px; color: #333333; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif;">
                        <strong>📋 Instrucciones:</strong>
                      </p>
                      <ul style="margin: 0; padding-left: 20px; color: #555555; font-size: 14px; line-height: 1.8;">
                        <li>Ingresa este código en la pantalla de verificación</li>
                        <li>No compartas este código con nadie</li>
                        <li>Si no solicitaste este código, ignora este correo</li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Security Notice -->
          <tr>
            <td class="mobile-padding" style="padding: 0 45px 30px 45px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff3cd; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="30" valign="top">
                          <span style="font-size: 20px;">🔒</span>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #856404; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif;">
                            <strong>Recordatorio de seguridad:</strong> Hunt Tickets nunca te pedirá tu código de verificación por teléfono, WhatsApp o correo. Mantén tu código privado.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Legal Footer with all info -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f3f3f3; font-size: 11px; color: #777777; text-align: center; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif;">
              <p style="margin: 0 0 10px 0; font-size: 13px; color: #555555; font-weight: 500; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif;">
                © 2025 Hunt Tickets S.A.S. NIT 901881747-0
              </p>
              <p style="margin: 0 0 15px 0; font-size: 12px; color: #666666; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif;">
                ¿Necesitas ayuda? Escríbenos a <a href="mailto:info@hunt-tickets.com" style="color: #555555; text-decoration: underline;">info@hunt-tickets.com</a>
              </p>
              <p style="margin: 0; line-height: 1.6; font-weight: 400; text-align: justify; font-family: 'Source Sans 3', Helvetica, Arial, sans-serif;">
                Por favor, no respondas ya que esta dirección no acepta correos electrónicos y no recibirás respuesta. Este correo electrónico de servicio contiene información esencial relacionada con tu cuenta de Hunt Tickets, tus compras reciente, reservas o suscripciones a uno de nuestros servicios. En Hunt Tickets respetamos y protegemos tu privacidad de acuerdo con nuestra <a href="https://www.hunt-tickets.com/resources/privacy" style="color: #555; text-decoration: underline;">Política de Privacidad</a> y <a href="https://www.hunt-tickets.com/resources/terms-and-conditions" style="color: #555; text-decoration: underline;">Términos & Condiciones</a>.
                Este correo ha sido enviado por Hunt Tickets S.A.S (NIT 901881747-0), con sede en la ciudad de Bogotá D.C., Colombia. La información contenida es confidencial y de uso exclusivo del destinatario.
              </p>
            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>
`;
        } else if (type === "email-verification") {
          subject = "Verify your email address";
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Verify your email address</h2>
              <p>Please use this verification code to complete your email verification:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
              </div>
              <p>This code will expire in 5 minutes.</p>
            </div>
          `;
        } else {
          subject = "Reset your password";
          html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Reset your password</h2>
              <p>Use this verification code to reset your password:</p>
              <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</span>
              </div>
              <p>This code will expire in 5 minutes.</p>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
            </div>
          `;
        }

        try {
          await resend.emails.send({
            from:
              process.env.FROM_EMAIL ||
              "Hunt Auth <team@support.hunttickets.com>",
            to: email,
            subject,
            html,
          });
          console.log(`${type} OTP sent to ${email}`);
        } catch (error) {
          console.error(`Failed to send ${type} OTP to ${email}:`, error);
          // For development, also log to console as fallback
          console.log(`Fallback - ${type} OTP for ${email}: ${otp}`);
        }
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
      // allowedAttempts: 3
    }),

    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        try {
          // Log for development
          console.log(`📱 Sending OTP to ${phoneNumber}: ${code}`);

          // Send SMS via Twilio
          const message = await getTwilioClient().messages.create({
            body: `Tu código de verificación Hunt Tickets: ${code}. Válido por 5 minutos. No compartas este código.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
          });

          console.log(`✅ SMS sent successfully. Message SID: ${message.sid}`);

          // Note: For unified email+SMS OTP during signup, we use a custom system
          // This function handles regular phone number verification
        } catch (error) {
          console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error);

          // For development, still log the code as fallback
          console.log(`Fallback - OTP for ${phoneNumber}: ${code}`);

          // Re-throw error so Better Auth can handle it
          throw new Error(
            `SMS delivery failed: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => {
          return `${phoneNumber}@my-site.com`;
        },
        //optionally, you can also pass `getTempName` function to generate a temporary name for the user
        getTempName: (phoneNumber) => {
          return phoneNumber; //by default, it will use the phone number as the name
        },
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),

    organization({
      // Schema customization with additional fields
      // These fields will be automatically accepted and returned by the API endpoints
      schema: {
        organization: {
          additionalFields: {
            tipoOrganizacion: {
              type: "string",
              required: false,
              input: true,
              fieldName: "tipo_organizacion",
            },
            nombres: {
              type: "string",
              required: false,
              input: true,
            },
            apellidos: {
              type: "string",
              required: false,
              input: true,
            },
            tipoDocumento: {
              type: "string",
              required: false,
              input: true,
              fieldName: "tipo_documento",
            },
            numeroDocumento: {
              type: "string",
              required: false,
              input: true,
              fieldName: "numero_documento",
            },
            nit: {
              type: "string",
              required: false,
              input: true,
            },
            direccion: {
              type: "string",
              required: false,
              input: true,
            },
            numeroTelefono: {
              type: "string",
              required: false,
              input: true,
              fieldName: "numero_telefono",
            },
            correoElectronico: {
              type: "string",
              required: false,
              input: true,
              fieldName: "correo_electronico",
            },
            rutUrl: {
              type: "string",
              required: false,
              input: true,
              fieldName: "rut_url",
            },
            cerlUrl: {
              type: "string",
              required: false,
              input: true,
              fieldName: "cerl_url",
            },
          },
        },
      },

      // If the requireEmailVerificationOnInvitation option is enabled in your organization configuration, users must verify their email address before they can accept invitations. This adds an extra security layer to ensure that only verified users can join your organization.
      requireEmailVerificationOnInvitation: true,

      // To add a member to an organization, we first need to send an invitation to the user. The user will receive an email/sms with the invitation link. Once the user accepts the invitation, they will be added to the organization.
      async sendInvitationEmail(data) {
        console.log(
          "📧 [INVITATION EMAIL] Starting to send invitation email..."
        );
        console.log("📧 [INVITATION EMAIL] Recipient:", data.email);
        console.log(
          "📧 [INVITATION EMAIL] Organization:",
          data.organization.name
        );
        console.log("📧 [INVITATION EMAIL] Inviter:", data.inviter.user.name);
        console.log("📧 [INVITATION EMAIL] Invitation ID:", data.id);

        // Invitation link
        // When a user receives an invitation email, they can click on the invitation link to accept the invitation. The invitation link should include the invitation ID, which will be used to accept the invitation.
        const inviteLink = `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/accept-invitation/${data.id}?org=${encodeURIComponent(data.organization.name)}`;

        console.log("📧 [INVITATION EMAIL] Invite link:", inviteLink);
        console.log(
          "📧 [INVITATION EMAIL] From email:",
          process.env.FROM_EMAIL
        );

        try {
          console.log("📧 [INVITATION EMAIL] Calling Resend API...");
          const result = await resend.emails.send({
            to: data.email,
            from:
              process.env.FROM_EMAIL ||
              "Hunt Auth <team@support.hunttickets.com>",
            subject: "Te han invitado a una Organizacion en Hunt-Tickets",
            react: OrganizationInvitationEmail({
              email: data.email,
              invitedByUsername: data.inviter.user.name,
              invitedByEmail: data.inviter.user.email,
              teamName: data.organization.name,
              inviteLink,
            }),
          });
          console.log(
            `✅ [INVITATION EMAIL] Email sent successfully to ${data.email}`
          );
          console.log(
            "✅ [INVITATION EMAIL] Resend response:",
            JSON.stringify(result, null, 2)
          );
        } catch (error) {
          console.error(
            `❌ [INVITATION EMAIL] Failed to send invitation email to ${data.email}`
          );
          console.error("❌ [INVITATION EMAIL] Error details:", error);
          if (error instanceof Error) {
            console.error(
              "❌ [INVITATION EMAIL] Error message:",
              error.message
            );
            console.error("❌ [INVITATION EMAIL] Error stack:", error.stack);
          }
          throw new Error("Failed to send invitation email");
        }
      },

      // execute a callback function when an invitation is accepted. This is useful for logging events, updating analytics, sending notifications, or any other custom logic you need to run when someone joins your organization.
      // async onInvitationAccepted(data) {
      //   // The callback receives the following data:
      //   // id: The invitation ID
      //   // role: The role assigned to the user
      //   // organization: The organization the user joined
      //   // invitation: The invitation object
      //   // inviter: The member who sent the invitation (including user details)
      //   // acceptedUser: The user who accepted the invitation
      //   console.log(data);
      // },
      teams: {
        enabled: false,
      },

      // Access control and roles configuration
      // Define three roles: seller, administrator, owner
      // - seller: basic access
      // - administrator: can invite members
      // - owner: can invite members and manage organization
      ac,
      roles: {
        owner,
        administrator,
        waiter,
      },
    }),
  ],

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"], // Auto-link if email is verified
      // allowDifferentEmails: false is the default (more secure)
      // Only allows linking if emails match
    },
  },

  user: {
    additionalFields: {
      userMetadata: {
        type: "json",
        required: false,
        input: false,
      },
      appMetadata: {
        type: "json",
        required: false,
        input: false,
      },
      invitedAt: {
        type: "date",
        required: false,
        input: false,
      },
      lastSignInAt: {
        type: "date",
        required: false,
        input: false,
      },
      documentId: {
        type: "string",
        required: false,
        input: true,
        fieldName: "document_id",
      },
      documentTypeId: {
        type: "string",
        required: false,
        input: true,
        fieldName: "document_type_id",
      },
      gender: {
        type: "string",
        required: false,
        input: true,
      },
      birthdate: {
        type: "date",
        required: false,
        input: true,
      },
      tipoPersona: {
        type: "string",
        required: false,
        input: true,
        fieldName: "tipo_persona",
      },
      nombres: {
        type: "string",
        required: false,
        input: true,
      },
      apellidos: {
        type: "string",
        required: false,
        input: true,
      },
      razonSocial: {
        type: "string",
        required: false,
        input: true,
        fieldName: "razon_social",
      },
      nit: {
        type: "string",
        required: false,
        input: true,
      },
      phoneNumber: {
        type: "string",
        required: false,
        input: true,
        fieldName: "phoneNumber",
      },
      phoneNumberVerified: {
        type: "boolean",
        required: false,
        input: true,
        fieldName: "phoneNumberVerified",
      },
    },
    changeEmail: {
      enabled: true,
      sendChangeEmailVerification: async ({ user, newEmail, url }) => {
        await resend.emails.send({
          from:
            process.env.FROM_EMAIL ||
            "Hunt Auth <team@support.hunttickets.com>",
          to: user.email, // Send to current email for verification
          subject: "Aprueba el cambio de correo electrónico",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Solicitud de cambio de correo electrónico</h2>
              <p>Hola ${user.name},</p>
              <p>Recibimos una solicitud para cambiar tu correo electrónico de <strong>${user.email}</strong> a <strong>${newEmail}</strong>.</p>
              <p>Si fuiste tú, haz clic en el siguiente enlace para aprobar el cambio:</p>
              <div style="margin: 30px 0;">
                <a href="${url}" style="background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Aprobar cambio de correo
                </a>
              </div>
              <p>Este enlace expirará en 24 horas.</p>
              <p>Si no solicitaste este cambio, ignora este correo.</p>
            </div>
          `,
        });
      },
    },
  },
});

// Export inferred types for use throughout the app
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

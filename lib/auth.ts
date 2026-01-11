import { db } from "@/db/drizzle";
import { schema } from "@/db/schema";
import OrganizationInvitationEmail from "@/components/emails/organization-invitation";
import ForgotPasswordEmail from "@/components/emails/reset-password";
import VerifyEmail from "@/components/emails/verify-email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization, emailOTP } from "better-auth/plugins";
import { Resend } from "resend";
import { ac, admin, member, owner } from "./auth/permissions";
// import { admin } from "better-auth/plugins";

const resend = new Resend(process.env.RESEND_API_KEY as string);

// To call an API endpoint on the server, import your auth instance and call the endpoint using the api object.
export const auth = betterAuth({
  // Better Auth requires a database connection to store data. The database will be used to store data such as users, sessions, and more. Plugins can also define their own database tables to store data.
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),

  trustedOrigins: [
    "http://localhost:3000",
    "http://192.168.0.7:3000",
    "https://1srdv3v4-3000.use2.devtunnels.ms",
    "https://tip-teal-two.vercel.app",
  ],

  // Server-side requests made using auth.api aren't affected by rate limiting. Rate limits only apply to client-initiated requests.
  // Rate limiting is disabled in development mode by default. In order to enable it, set enabled to true:
  // Rate limiting uses the connecting IP address to track the number of requests made by a user.
  // Rate limiting uses the connecting IP address to track the number of requests made by a user. The default header checked is x-forwarded-for, which is commonly used in production environments. If you are using a different header to track the user's IP address, you'll need to specify it.
  // By default, rate limit data is stored in memory, which may not be suitable for many use cases, particularly in serverless environments. To address this, you can use a database, secondary storage, or custom storage for storing rate limit data.
  // rateLimit: {
  //   enabled: true,
  //   window: 60, // time window in seconds
  //   max: 100, // max requests in the window
  // },

  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      resend.emails.send({
        from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Restablece tu contraseña",
        react: ForgotPasswordEmail({
          username: user.name,
          resetUrl: url,
          userEmail: user.email,
          token: token,
        }),
      });
    },
    requireEmailVerification: true,
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Redirect to dashboard after verification (user will be auto-signed in)
      const verifyUrl = new URL(url);
      verifyUrl.searchParams.set("callbackURL", "/dashboard");

      resend.emails.send({
        from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Verify your email address",
        react: VerifyEmail({
          username: user.name,
          verifyUrl: verifyUrl.toString(),
        }),
      });
    },

    // The afterEmailVerification function runs automatically when a user's email is confirmed, receiving the user object and request details so you can perform actions for that specific user.
    async afterEmailVerification(user) {
      // Your custom logic here, e.g., grant access to premium features
      console.log(`${user.email} has been successfully verified!`);
    },

    sendOnSignUp: true,
    autoSignInAfterVerification: true, // Automatically sign in after verification
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  // Plugins are a key part of Better Auth, they let you extend the base functionalities. You can use them to add new authentication methods, features, or customize behaviors.
  plugins: [
    nextCookies(),

    // Organizations simplifies user access and permissions management. Assign roles and permissions to streamline project management, team coordination, and partnerships.
    organization({
      // If the requireEmailVerificationOnInvitation option is enabled in your organization configuration, users must verify their email address before they can accept invitations. This adds an extra security layer to ensure that only verified users can join your organization.
      requireEmailVerificationOnInvitation: true,

      // To add a member to an organization, we first need to send an invitation to the user. The user will receive an email/sms with the invitation link. Once the user accepts the invitation, they will be added to the organization.
      async sendInvitationEmail(data) {
        // Invitation link
        // When a user receives an invitation email, they can click on the invitation link to accept the invitation. The invitation link should include the invitation ID, which will be used to accept the invitation.
        const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invitation/${data.id}`;

        // Send the email
        resend.emails.send({
          to: data.email,
          from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
          subject: "Has sido invitado a unirte a nuestra organización.",
          react: OrganizationInvitationEmail({
            email: data.email,
            invitedByUsername: data.inviter.user.name,
            invitedByEmail: data.inviter.user.email,
            teamName: data.organization.name,
            inviteLink,
          }),
        });
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
        enabled: false, // Not needed for restaurants
      },

      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),

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

          // // Send SMS with the same OTP code if we have the phone number
          // if (phoneNumber) {
          //   try {
          //     // Check if phone number is already verified by another user
          //     const existingVerifiedUser = await db
          //       .select()
          //       .from(schema.user)
          //       .where(
          //         and(
          //           eq(schema.user.phoneNumber, phoneNumber),
          //           eq(schema.user.phoneNumberVerified, true)
          //         )
          //       )
          //       .limit(1);

          //     if (existingVerifiedUser.length > 0) {
          //       console.log(
          //         `🚫 Phone number ${phoneNumber} is already verified by another user, skipping SMS`
          //       );
          //       // Don't send SMS to verified phone numbers owned by other users
          //       return;
          //     }

          //     console.log(
          //       `📱 Also sending email OTP code to SMS ${phoneNumber}: ${otp}`
          //     );

          //     const message = await getTwilioClient().messages.create({
          //       body: `Tu código de verificación Tip: ${otp}. Válido por 5 minutos. No compartas este código.`,
          //       from: process.env.TWILIO_PHONE_NUMBER,
          //       to: phoneNumber,
          //     });

          //     console.log(
          //       `✅ SMS also sent successfully. Message SID: ${message.sid}`
          //     );
          //   } catch (smsError) {
          //     console.error(
          //       `⚠️ Failed to send SMS to ${phoneNumber}:`,
          //       smsError
          //     );
          //     // Don't fail the entire process if SMS fails, email is the primary method
          //   }
          // }

          html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Código de verificación - Tip</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background: #ffffff; border-radius: 8px;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: #10b981; border-radius: 8px 8px 0 0;">
              <span style="font-size: 28px; font-weight: bold; color: #ffffff;">TIP</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 24px; font-size: 16px; color: #333; text-align: center;">
                Tu código de verificación es:
              </p>
              <div style="background: #f5f5f5; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #10b981;">${otp}</span>
              </div>
              <p style="margin: 0 0 16px; font-size: 14px; color: #666; text-align: center;">
                Válido por 10 minutos. No compartas este código.
              </p>
              <p style="margin: 0; font-size: 13px; color: #999; text-align: center;">
                Si no solicitaste este código, ignora este correo.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background: #fafafa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                © 2025 Tip. Todos los derechos reservados.
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
            from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
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
  ],
});

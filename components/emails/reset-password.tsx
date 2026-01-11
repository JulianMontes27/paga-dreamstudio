import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface ForgotPasswordEmailProps {
  username: string;
  resetUrl: string;
  userEmail: string;
  token?: string;
}

const ForgotPasswordEmail = (props: ForgotPasswordEmailProps) => {
  const { username, resetUrl, userEmail, token } = props;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Reset your TIP password</Preview>
        <Body className="bg-gray-50 font-sans py-[40px]">
          <Container className="bg-white rounded-[16px] p-[40px] max-w-[580px] mx-auto shadow-lg">
            <Section>
              {/* Header with Logo */}
              <div className="text-center mb-[32px]">
                <Text className="text-[40px] font-black m-0 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent inline-block">
                  TIP
                </Text>
              </div>

              {/* Reset Message */}
              <Text className="text-[28px] font-bold text-gray-900 mb-[8px] mt-0 text-center">
                Password Reset Request
              </Text>

              <Text className="text-[16px] text-gray-600 mb-[32px] mt-0 text-center leading-[26px]">
                Hey {username}, let&apos;s get you back into your account
              </Text>

              {/* Main CTA Button */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={resetUrl}
                  style={{
                    backgroundColor: "#3b82f6",
                    color: "#ffffff",
                    padding: "16px 48px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Reset My Password →
                </Button>
              </Section>

              {/* Security Info Section */}
              <Section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[12px] p-[24px] mb-[24px] border border-blue-200">
                <Text className="text-[14px] font-semibold text-gray-900 mb-[12px] mt-0">
                  🔐 Security Information:
                </Text>
                <div className="space-y-[8px]">
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ This link expires in 24 hours
                  </Text>
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ You&apos;ll create a new password on the next page
                  </Text>
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ Your account will be secured immediately
                  </Text>
                </div>
              </Section>

              {/* Alternative Link Section */}
              <Section className="bg-amber-50 border border-amber-200 rounded-[8px] p-[16px] mb-[24px]">
                <Text className="text-[13px] text-gray-700 m-0 mb-[8px]">
                  Button not working? Copy this link:
                </Text>
                <Text className="text-[12px] text-blue-600 m-0 break-all font-mono">
                  {resetUrl}
                </Text>
              </Section>

              {/* Not You Section */}
              <Section className="bg-red-50 border border-red-200 rounded-[8px] p-[16px] mb-[24px]">
                <Text className="text-[13px] text-gray-700 m-0">
                  <strong>Didn&apos;t request this?</strong> You can safely
                  ignore this email. Your password won&apos;t be changed unless
                  you click the link above.
                </Text>
              </Section>

              {/* Account Info */}
              <Text className="text-[13px] text-gray-500 text-center mb-[24px] mt-0">
                This request was made for: {userEmail}
              </Text>

              <Hr className="border-gray-200 my-[24px]" />

              {/* Footer */}
              <Text className="text-[14px] text-gray-600 text-center m-0">
                Need help? Reply to this email
                <br />
                <span className="text-[13px] text-gray-400">
                  TIP - Modern POS for modern businesses
                </span>
              </Text>
            </Section>
          </Container>

          {/* Copyright Footer */}
          <Text className="text-[11px] text-gray-400 text-center mt-[24px] mb-0">
            © 2024 TIP. All rights reserved.
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ForgotPasswordEmail;

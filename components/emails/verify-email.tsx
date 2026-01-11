import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Tailwind,
} from "@react-email/components";

interface VerifyEmailProps {
  username: string;
  verifyUrl: string;
}

const VerifyEmail = (props: VerifyEmailProps) => {
  const { username, verifyUrl } = props;
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Body className="bg-gray-50 font-sans py-[40px]">
          <Container className="bg-white rounded-[16px] p-[40px] max-w-[580px] mx-auto shadow-lg">
            <Section>
              {/* Header with Logo */}
              <div className="text-center mb-[32px]">
                <Text className="text-[40px] font-black m-0 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent inline-block">
                  TIP
                </Text>
              </div>

              {/* Welcome Message */}
              <Text className="text-[28px] font-bold text-gray-900 mb-[8px] mt-0 text-center">
                Welcome aboard, {username}!
              </Text>

              <Text className="text-[16px] text-gray-600 mb-[32px] mt-0 text-center leading-[26px]">
                One quick step to activate your TIP account
              </Text>

              {/* Main CTA Button */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={verifyUrl}
                  style={{
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    padding: "16px 48px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Verify My Email →
                </Button>
              </Section>

              {/* Features Section */}
              <Section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-[12px] p-[24px] mb-[24px] border border-gray-200">
                <Text className="text-[14px] font-semibold text-gray-900 mb-[12px] mt-0">
                  🚀 What&apos;s waiting for you:
                </Text>
                <div className="space-y-[8px]">
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ Accept payments instantly
                  </Text>
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ Track inventory in real-time
                  </Text>
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ Manage your entire business from one dashboard
                  </Text>
                </div>
              </Section>

              {/* Alternative Link Section */}
              <Section className="bg-amber-50 border border-amber-200 rounded-[8px] p-[16px] mb-[24px]">
                <Text className="text-[13px] text-gray-700 m-0 mb-[8px]">
                  Button not working? Copy this link:
                </Text>
                <Text className="text-[12px] text-blue-600 m-0 break-all font-mono">
                  {verifyUrl}
                </Text>
              </Section>

              {/* Security Notice */}
              <Text className="text-[13px] text-gray-500 text-center mb-[24px] mt-0">
                This link expires in 24 hours • Didn&apos;t sign up? Ignore this email
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

export default VerifyEmail;

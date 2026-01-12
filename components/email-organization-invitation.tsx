import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

interface OrganizationInvitationEmailProps {
  email: string;
  invitedByUsername: string;
  invitedByEmail: string;
  teamName: string;
  inviteLink: string;
}

const OrganizationInvitationEmail = (
  props: OrganizationInvitationEmailProps
) => {
  return (
    <Html lang="es" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Has sido invitado a unirte a {props.teamName}</Preview>
        <Body className="bg-gray-50 font-sans py-[40px]">
          <Container className="bg-white rounded-[16px] p-[40px] max-w-[580px] mx-auto shadow-lg">
            <Section>
              {/* Header with Logo */}
              <div className="text-center mb-[32px]">
                <Img
                  src="https://jtfcfsnksywotlbsddqb.supabase.co/storage/v1/object/public/default/hunt_logo.png"
                  alt="Hunt Tickets"
                  width="140"
                  height="46"
                  className="mx-auto"
                />
              </div>

              {/* Invitation Message */}
              <Text className="text-[28px] font-bold text-gray-900 mb-[8px] mt-0 text-center">
                ¡Has sido invitado!
              </Text>

              <Text className="text-[16px] text-gray-600 mb-[32px] mt-0 text-center leading-[26px]">
                Únete a <strong>{props.teamName}</strong> en Hunt Tickets
              </Text>

              {/* Inviter Info Section */}
              <Section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-[12px] p-[24px] mb-[24px] border border-purple-200">
                <Text className="text-[14px] font-semibold text-gray-900 mb-[12px] mt-0">
                  👋 Invitado por:
                </Text>
                <Text className="text-[14px] text-gray-700 m-0">
                  <strong>{props.invitedByUsername}</strong>
                </Text>
                <Text className="text-[13px] text-gray-600 m-0">
                  {props.invitedByEmail}
                </Text>
              </Section>

              {/* Main CTA Button */}
              <Section className="text-center mb-[32px]">
                <Button
                  href={props.inviteLink}
                  style={{
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    padding: "16px 48px",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: "600",
                    textDecoration: "none",
                    display: "inline-block",
                  }}
                >
                  Aceptar Invitación →
                </Button>
              </Section>

              {/* Info Section */}
              <Section className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[12px] p-[24px] mb-[24px] border border-blue-200">
                <Text className="text-[14px] font-semibold text-gray-900 mb-[12px] mt-0">
                  📋 ¿Qué obtienes?
                </Text>
                <div className="space-y-[8px]">
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ Acceso a la organización {props.teamName}
                  </Text>
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ Colabora con tu equipo
                  </Text>
                  <Text className="text-[14px] text-gray-600 m-0 leading-[20px]">
                    ✓ Gestiona eventos y entradas
                  </Text>
                </div>
              </Section>

              {/* Alternative Link Section */}
              <Section className="bg-amber-50 border border-amber-200 rounded-[8px] p-[16px] mb-[24px]">
                <Text className="text-[13px] text-gray-700 m-0 mb-[8px]">
                  ¿El botón no funciona? Copia este enlace:
                </Text>
                <Text className="text-[12px] text-blue-600 m-0 break-all font-mono">
                  {props.inviteLink}
                </Text>
              </Section>

              {/* Not You Section */}
              <Section className="bg-gray-50 border border-gray-200 rounded-[8px] p-[16px] mb-[24px]">
                <Text className="text-[13px] text-gray-700 m-0">
                  <strong>¿No esperabas esta invitación?</strong> Puedes ignorar
                  este correo de forma segura. No se realizará ningún cambio en
                  tu cuenta.
                </Text>
              </Section>

              {/* Account Info */}
              <Text className="text-[13px] text-gray-500 text-center mb-[24px] mt-0">
                Esta invitación fue enviada a: {props.email}
              </Text>

              <Hr className="border-gray-200 my-[24px]" />

              {/* Footer */}
              <Text className="text-[14px] text-gray-600 text-center m-0">
                ¿Necesitas ayuda? Escríbenos a info@hunt-tickets.com
                <br />
                <span className="text-[13px] text-gray-400">
                  Hunt Tickets - Tu plataforma de eventos
                </span>
              </Text>
            </Section>
          </Container>

          {/* Copyright Footer */}
          <Text className="text-[11px] text-gray-400 text-center mt-[24px] mb-0">
            © {new Date().getFullYear()} Hunt Tickets S.A.S. NIT 901881747-0.
            Todos los derechos reservados.
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrganizationInvitationEmail;

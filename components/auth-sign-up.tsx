"use client";

import { SignUpPage } from "./sign-up";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const translateError = (errorMessage: string): string => {
  // Rate limiting error
  if (
    errorMessage.includes("For security purposes") ||
    errorMessage.includes("Email rate limit exceeded")
  ) {
    const match = errorMessage.match(/after (\d+) seconds/);
    const seconds = match ? match[1] : "unos";
    return `Por seguridad, puedes solicitar esto después de ${seconds} segundos.`;
  }

  // Other common errors
  if (
    errorMessage.includes("Invalid login credentials") ||
    errorMessage.includes("Invalid OTP")
  ) {
    return "Código de verificación inválido";
  }
  if (errorMessage.includes("Invalid password")) {
    return "Contraseña incorrecta";
  }
  if (errorMessage.includes("Email not confirmed")) {
    return "Correo electrónico no confirmado";
  }
  if (errorMessage.includes("User already registered")) {
    return "Usuario ya registrado";
  }

  return errorMessage;
};

export const AuthSignUp = () => {
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [userData, setUserData] = useState<{
    nombre: string;
    apellido: string;
    birthday: string;
    tipoDocumento: string;
    numeroDocumento: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect URL from query params
  const getRedirectUrl = () => {
    const redirect = searchParams?.get("redirect");
    if (redirect) {
      try {
        const url = new URL(redirect);
        const isValidDomain =
          url.hostname.endsWith(".hunt-tickets.com") ||
          url.hostname === "hunt-tickets.com" ||
          url.hostname === "localhost" ||
          url.hostname.startsWith("192.168.") ||
          url.hostname.startsWith("10.") ||
          url.hostname.startsWith("172.");

        if (isValidDomain) {
          return redirect;
        }
      } catch (e) {
        console.log("Invalid redirect URL:", e);
      }
    }
    return "/profile";
  };

  const handleRedirect = (url: string) => {
    try {
      const redirectUrl = new URL(url);
      const currentUrl = new URL(window.location.href);

      if (redirectUrl.origin !== currentUrl.origin) {
        window.location.href = url;
      } else {
        router.push(url);
      }
    } catch (e) {
      console.log(e);
      router.push(url);
    }
  };

  const handleSendOtp = async (data: {
    email: string;
    nombre: string;
    apellido: string;
    birthday: string;
    tipoDocumento: string;
    numeroDocumento: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    setEmail(data.email);
    setUserData(data);

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: data.email,
        type: "sign-in",
      });
      setIsOtpSent(true);
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Ocurrió un error";

      setError(translateError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await authClient.signIn.emailOtp(
        { email, otp },
        {
          onSuccess: async () => {
            // Update user profile with additional data
            if (userData) {
              try {
                // Map document type names to their database UUIDs (Colombia)
                const documentTypeMapping: Record<string, string> = {
                  "Cédula de Ciudadanía":
                    "f87aaaf0-53d1-4e63-90d5-afe3c8784e31",
                  "Cédula de Extranjería":
                    "0b548efa-0689-4935-8c42-5c219e7ffd60",
                  Pasaporte: "ca2f187a-7fac-491f-a9b7-36fa5975855c",
                  PEP: "76201a7e-fd86-4ba3-aba6-eabceabb983e",
                  PPT: "bb7988e4-ee61-4776-9ef1-921fd6cd94f3",
                };

                await authClient.updateUser({
                  name: `${userData.nombre} ${userData.apellido}`,
                  nombres: userData.nombre,
                  apellidos: userData.apellido,
                  birthdate: userData.birthday
                    ? new Date(userData.birthday)
                    : undefined,
                  documentId: userData.numeroDocumento || undefined,
                  documentTypeId: userData.tipoDocumento
                    ? documentTypeMapping[userData.tipoDocumento]
                    : undefined,
                });

                // Phone number requires separate verification flow
                // User can add/verify it later from their profile page
              } catch (updateError) {
                console.error("Failed to update user profile:", updateError);
              }
            }
            handleRedirect(getRedirectUrl());
          },
          onError: (error: unknown) => {
            const errorMsg =
              error instanceof Error ? error.message : "Código inválido";

            setError(translateError(errorMsg));
          },
        }
      );
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Código inválido";
      setError(translateError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });
      setMessage("Código reenviado exitosamente");
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error ? error.message : "Ocurrió un error";

      setError(translateError(errorMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    const redirect = searchParams?.get("redirect");
    if (redirect) {
      router.push(`/sign-in?redirect=${encodeURIComponent(redirect)}`);
    } else {
      router.push("/sign-in");
    }
  };

  return (
    <SignUpPage
      title={
        <span
          className="font-semibold text-foreground tracking-tight"
          style={{ fontFamily: "LOT, sans-serif" }}
        >
          Join Elio
        </span>
      }
      description={
        isOtpSent
          ? "Hemos enviado un código de 6 dígitos a tu correo electrónico"
          : "Crea tu cuenta y comienza a descubrir eventos increíbles"
      }
      onSendOtp={handleSendOtp}
      onVerifyOtp={handleVerifyOtp}
      onResendOtp={handleResendOtp}
      onLogin={handleLogin}
      isOtpSent={isOtpSent}
      isLoading={isLoading}
      error={error}
      message={message}
    />
  );
};

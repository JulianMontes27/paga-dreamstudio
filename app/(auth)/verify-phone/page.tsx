"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { sanitizePhoneNumber, sanitizeOTP } from "@/lib/utils/sanitize";

function VerifyPhoneForm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sanitize URL parameters
  const phoneNumber = sanitizePhoneNumber(searchParams.get("phone") || "");

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    // Sanitize OTP
    const sanitizedOtp = sanitizeOTP(otpString);

    if (sanitizedOtp.length !== 6) {
      setError("Por favor ingresa el código completo");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify phone OTP and sign in/up
      await authClient.phoneNumber.verify({
        phoneNumber,
        code: sanitizedOtp,
        disableSession: false,
        updatePhoneNumber: false,
      });

      // Get the pending sign-up data
      const pendingDataStr = sessionStorage.getItem("pendingSignUpData");
      if (pendingDataStr) {
        const pendingData = JSON.parse(pendingDataStr);

        // Update user with additional info
        try {
          await authClient.updateUser({
            name: pendingData.name,
            phoneNumber: pendingData.phoneNumber,
            // Note: Better Auth doesn't support custom fields by default
            // You may need to store birthday, documentType, documentNumber separately
            // or extend the user schema
          });

          // Clear the pending data
          sessionStorage.removeItem("pendingSignUpData");
        } catch (updateError) {
          console.error("Failed to update user profile:", updateError);
        }
      }

      router.push("/profile");
    } catch (err) {
      console.error("Phone verification error:", err);
      setError("Error al verificar el código");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setError("");

    try {
      await authClient.phoneNumber.sendOtp({
        phoneNumber,
      });

      setCountdown(60);
      setCanResend(false);
      setError("");
    } catch (err) {
      console.error("Failed to resend OTP:", err);
      setError("Error al reenviar el código");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex items-center justify-center p-4 relative">
      {/* Back button */}
      <Link
        href="/sign-up"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <div className="p-2 rounded-full border dark:border-[#303030] bg-background/80 backdrop-blur-sm group-hover:bg-background transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="hidden sm:inline">Volver</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight mb-3">
              <span className="font-light text-foreground tracking-tighter">
                Verificar teléfono
              </span>
            </h1>
            <p className="text-muted-foreground">
              Ingresa el código de 6 dígitos que enviamos a
            </p>
            <p className="text-foreground font-medium mt-1">{phoneNumber}</p>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="flex gap-2 justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-semibold rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus:outline-none focus:border-primary focus:bg-primary/5"
                  disabled={loading}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar código"}
            </button>

            <div className="text-center text-sm">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                  disabled={loading}
                >
                  Reenviar código
                </button>
              ) : (
                <p className="text-muted-foreground">
                  Reenviar código en {countdown}s
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RouteComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPhoneForm />
    </Suspense>
  );
}

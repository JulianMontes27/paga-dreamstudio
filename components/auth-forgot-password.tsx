"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const sanitizeEmail = (email: string): string => {
  return email
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim()
    .slice(0, 100);
};

export const AuthForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (resetError) {
        setError(resetError.message || "Ocurrió un error");
      } else {
        setIsEmailSent(true);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Ocurrió un error";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex items-center justify-center p-4 relative">
      {/* Back button */}
      <Link
        href="/sign-in"
        className="absolute top-6 left-6 z-50 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <div className="p-2 rounded-full border dark:border-[#303030] bg-background/80 backdrop-blur-sm group-hover:bg-background transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        <span className="hidden sm:inline">Volver</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight text-foreground">
            <span
              className="font-semibold text-foreground tracking-tight"
              style={{ fontFamily: "LOT, sans-serif" }}
            >
              Recuperar contraseña
            </span>
          </h1>

          {!isEmailSent ? (
            <>
              <p className="text-gray-400">
                Ingresa tu correo electrónico y te enviaremos un enlace para
                restablecer tu contraseña.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Correo electrónico
                  </label>
                  <div className="rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/50 focus-within:bg-primary/5">
                    <input
                      name="email"
                      type="email"
                      placeholder="tu@correo.com"
                      className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                      value={email}
                      onChange={(e) =>
                        setEmail(sanitizeEmail(e.target.value.toLowerCase()))
                      }
                      maxLength={100}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={isLoading || !email}
                >
                  {isLoading ? "Enviando..." : "Enviar enlace"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-gray-400">
                Hemos enviado un enlace de recuperación a{" "}
                <span className="text-foreground font-medium">{email}</span>.
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => router.push("/sign-in")}
                  className="w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Volver a iniciar sesión
                </button>

                <button
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmail("");
                  }}
                  className="w-full text-sm text-gray-400 hover:text-foreground transition-colors"
                >
                  Usar otro correo electrónico
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

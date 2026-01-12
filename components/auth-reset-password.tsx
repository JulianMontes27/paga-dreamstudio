"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export const AuthResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");
  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    if (!token) {
      setError("Token de recuperación no válido");
      return;
    }

    setIsLoading(true);

    try {
      await authClient.resetPassword({
        newPassword: password,
        token,
      });
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Ocurrió un error";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Show error if token is invalid or expired
  if (urlError === "INVALID_TOKEN" || (!token && !isSuccess)) {
    return (
      <div className="h-[100dvh] flex items-center justify-center p-4 relative">
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
                Enlace expirado
              </span>
            </h1>

            <p className="text-gray-400">
              El enlace de recuperación ha expirado o no es válido. Por favor,
              solicita un nuevo enlace.
            </p>

            <button
              onClick={() => router.push("/forgot-password")}
              className="w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Solicitar nuevo enlace
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              Nueva contraseña
            </span>
          </h1>

          {!isSuccess ? (
            <>
              <p className="text-gray-400">
                Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
              </p>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Nueva contraseña
                  </label>
                  <div className="rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/50 focus-within:bg-primary/5">
                    <div className="flex items-center gap-2 px-4">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Ingresa tu nueva contraseña"
                        className="flex-1 bg-transparent text-sm py-4 focus:outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    Confirmar contraseña
                  </label>
                  <div className="rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/50 focus-within:bg-primary/5">
                    <div className="flex items-center gap-2 px-4">
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirma tu nueva contraseña"
                        className="flex-1 bg-transparent text-sm py-4 focus:outline-none"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={8}
                        maxLength={128}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={isLoading || !password || !confirmPassword}
                >
                  {isLoading ? "Guardando..." : "Restablecer contraseña"}
                </button>
              </form>
            </>
          ) : (
            <>
              <p className="text-gray-400">
                Tu contraseña ha sido restablecida exitosamente. Ya puedes
                iniciar sesión con tu nueva contraseña.
              </p>

              <button
                onClick={() => router.push("/sign-in")}
                className="w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

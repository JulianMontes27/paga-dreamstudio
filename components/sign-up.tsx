"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { SimpleDatePicker } from "./simple-date-picker";

// Sanitization helpers
const sanitizeText = (text: string): string => {
  // Remove any HTML tags and potentially malicious characters
  return text
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
    .slice(0, 100); // Limit length
};

const sanitizeName = (name: string): string => {
  // Allow only letters, spaces, hyphens, and accented characters
  return name
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]/g, "")
    .trim()
    .slice(0, 50);
};

const sanitizeDocumentNumber = (doc: string): string => {
  // Allow only alphanumeric characters
  return doc
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 20);
};

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

export interface SignUpFormData {
  email: string;
  nombre: string;
  apellido: string;
  birthday: string;
  tipoDocumento: string;
  numeroDocumento: string;
}

interface SignUpPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSendOtp?: (data: SignUpFormData) => void;
  onVerifyOtp?: (otp: string) => void;
  onResendOtp?: () => void;
  onLogin?: () => void;
  isOtpSent?: boolean;
  isLoading?: boolean;
  error?: string | null;
  message?: string | null;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/50 focus-within:bg-primary/5">
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export const SignUpPage: React.FC<SignUpPageProps> = ({
  title = (
    <span className="font-light text-foreground tracking-tighter">
      Crear cuenta
    </span>
  ),
  description = "Únete a nosotros y comienza tu experiencia",
  onSendOtp,
  onVerifyOtp,
  onResendOtp,
  onLogin,
  isOtpSent = false,
  isLoading = false,
  error = null,
  message = null,
}) => {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [birthday, setBirthday] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("Cédula de Ciudadanía");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (isOtpSent && resendCountdown > 0) {
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isOtpSent, resendCountdown]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      return;
    }
    onSendOtp?.({
      email,
      nombre,
      apellido,
      birthday,
      tipoDocumento,
      numeroDocumento,
    });
  };

  const handleResendOtp = () => {
    setResendCountdown(60);
    setCanResend(false);
    onResendOtp?.();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    onVerifyOtp?.(otp.join(""));
  };

  return (
    <div className="w-full max-w-md pb-8 md:pb-0">
      <div className="flex flex-col gap-6">
        <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-foreground">
          {title}
        </h1>
        <p className="animate-element animate-delay-200 text-gray-400">
          {isOtpSent
            ? "Hemos enviado un código de 6 dígitos a tu correo electrónico"
            : description}
        </p>

        {!isOtpSent ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <div className="animate-element animate-delay-300 space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Nombre
                </label>
                <GlassInputWrapper>
                  <input
                    name="nombre"
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                    value={nombre}
                    onChange={(e) => setNombre(sanitizeName(e.target.value))}
                    maxLength={50}
                    pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]+"
                    required
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-300 space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Apellido
                </label>
                <GlassInputWrapper>
                  <input
                    name="apellido"
                    type="text"
                    placeholder="Tu apellido"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                    value={apellido}
                    onChange={(e) => setApellido(sanitizeName(e.target.value))}
                    maxLength={50}
                    pattern="[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]+"
                    required
                  />
                </GlassInputWrapper>
              </div>
            </div>

            <div className="animate-element animate-delay-300 space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Correo electrónico
              </label>
              <GlassInputWrapper>
                <input
                  name="email"
                  type="email"
                  placeholder="tu@correo.com"
                  className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                  value={email}
                  onChange={(e) =>
                    setEmail(sanitizeText(e.target.value.toLowerCase()))
                  }
                  maxLength={100}
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                  required
                />
              </GlassInputWrapper>
            </div>

            <div className="animate-element animate-delay-300 space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Fecha de nacimiento{" "}
                <span className="text-gray-500 font-normal">(opcional)</span>
              </label>
              <SimpleDatePicker
                name="birthday"
                value={birthday}
                onChange={setBirthday}
                placeholder="Selecciona tu fecha de nacimiento"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="animate-element animate-delay-300 space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Tipo de documento{" "}
                  <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <GlassInputWrapper>
                  <select
                    name="tipoDocumento"
                    className="w-full bg-transparent text-sm p-4 pr-10 rounded-2xl focus:outline-none appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 1rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
                    }}
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                  >
                    <option value="Cédula de Ciudadanía">
                      Cédula de Ciudadanía
                    </option>
                    <option value="Cédula de Extranjería">
                      Cédula de Extranjería
                    </option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="PEP">PEP</option>
                    <option value="PPT">PPT</option>
                  </select>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-300 space-y-2">
                <label className="text-sm font-medium text-gray-400">
                  Número de documento{" "}
                  <span className="text-gray-500 font-normal">(opcional)</span>
                </label>
                <GlassInputWrapper>
                  <input
                    name="numeroDocumento"
                    type="text"
                    inputMode="numeric"
                    placeholder="1234567890"
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                    value={numeroDocumento}
                    onChange={(e) => {
                      const value = sanitizeDocumentNumber(e.target.value);
                      setNumeroDocumento(value);
                    }}
                    maxLength={20}
                    pattern="[A-Z0-9]+"
                  />
                </GlassInputWrapper>
              </div>
            </div>

            <div className="animate-element animate-delay-300">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 rounded-md border-2 border-muted-foreground/30 bg-background/50 transition-all peer-checked:bg-primary peer-checked:border-primary peer-focus:ring-2 peer-focus:ring-primary/50 flex items-center justify-center">
                    <Check
                      className={`w-3.5 h-3.5 text-primary-foreground transition-all ${
                        acceptedTerms
                          ? "scale-100 opacity-100"
                          : "scale-0 opacity-0"
                      }`}
                      strokeWidth={3}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-400 leading-relaxed">
                  Acepto los{" "}
                  <Link
                    href="/terms-and-conditions"
                    className="text-foreground font-medium hover:text-primary transition-colors underline-offset-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    términos y condiciones
                  </Link>{" "}
                  y la{" "}
                  <Link
                    href="/privacy"
                    className="text-foreground font-medium hover:text-primary transition-colors underline-offset-2 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    política de privacidad
                  </Link>
                </span>
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <button
              type="submit"
              className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:bg-muted disabled:text-gray-400 disabled:cursor-not-allowed"
              disabled={!acceptedTerms || isLoading}
            >
              {isLoading ? "Enviando código..." : "Crear cuenta"}
            </button>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div className="animate-element animate-delay-300 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Correo electrónico
              </label>
              <GlassInputWrapper>
                <input
                  name="email"
                  type="email"
                  className="w-full text-sm p-4 rounded-2xl focus:outline-none bg-muted/50"
                  value={email}
                  maxLength={100}
                  disabled
                />
              </GlassInputWrapper>
            </div>

            <div className="animate-element animate-delay-400 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Código de verificación
              </label>
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
                    className="w-full h-14 text-center text-lg font-semibold rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus:outline-none focus:border-primary/50 focus:bg-primary/5"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    pattern="[0-9]"
                    autoComplete="off"
                    required
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}

            <button
              type="submit"
              className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Verificando..." : "Verificar código"}
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleResendOtp}
                className="flex-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canResend || isLoading}
              >
                {canResend
                  ? "Reenviar código"
                  : `Reenviar en ${resendCountdown}s`}
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Usar otro correo
              </button>
            </div>
          </form>
        )}

        {!isOtpSent && (
          <p className="animate-element animate-delay-650 text-center text-sm text-gray-400">
            ¿Ya tienes una cuenta?{" "}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onLogin?.();
              }}
              className="text-foreground hover:underline transition-colors"
            >
              Iniciar sesión
            </a>
          </p>
        )}
      </div>
    </div>
  );
};

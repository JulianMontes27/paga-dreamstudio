"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PhoneInput } from './phone-input';

// Sanitization helpers
const sanitizeEmail = (email: string): string => {
  // Remove any HTML tags and potentially malicious characters
  return email
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 100); // Limit length
};

const sanitizePassword = (password: string): string => {
  // Remove potentially malicious characters while allowing special chars for passwords
  return password
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .slice(0, 100); // Limit length
};

// --- HELPER COMPONENTS (ICONS) ---

const GoogleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C37.023 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
);

// const AppleIcon = () => (
//     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
//         <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
//     </svg>
// );


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  onSendOtp?: (email: string) => void;
  onSendPhoneOtp?: (phoneNumber: string) => void;
  onSignInWithPassword?: (email: string, password: string) => void;
  onVerifyOtp?: (email: string, otp: string) => void;
  onVerifyPhoneOtp?: (phoneNumber: string, otp: string) => void;
  onResendOtp?: (email: string) => void;
  onResendPhoneOtp?: (phoneNumber: string) => void;
  onGoogleSignIn?: () => void;
  onAppleSignIn?: () => void;
  onCreateAccount?: () => void;
  onForgotPassword?: () => void;
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

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-foreground tracking-tighter">Bienvenido</span>,
  description = "Accede a tu cuenta y continúa tu experiencia con nosotros",
  onSendOtp,
  onSendPhoneOtp,
  onSignInWithPassword,
  onVerifyOtp,
  onVerifyPhoneOtp,
  onResendOtp,
  onResendPhoneOtp,
  onGoogleSignIn,
  onAppleSignIn,
  onCreateAccount,
  onForgotPassword,
  isOtpSent = false,
  isLoading = false,
  error = null,
  message = null,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [usePassword, setUsePassword] = useState(false);
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

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (usePassword) {
      // Sign in with email and password
      onSignInWithPassword?.(email, password);
    } else if (loginMethod === "phone") {
      onSendPhoneOtp?.(email); // email state holds phone number when phone is selected
    } else {
      onSendOtp?.(email);
    }
  };

  const handleResendOtp = () => {
    setResendCountdown(60);
    setCanResend(false);
    if (loginMethod === "phone") {
      onResendPhoneOtp?.(email);
    } else {
      onResendOtp?.(email);
    }
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

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod === "phone") {
      onVerifyPhoneOtp?.(email, otp.join(""));
    } else {
      onVerifyOtp?.(email, otp.join(""));
    }
  };

  return (
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-foreground">{title}</h1>
            <p className="animate-element animate-delay-200 text-gray-400">{description}</p>

            {!isOtpSent ? (
              <form className="space-y-5" onSubmit={handleSendOtp}>
                {/* Tabs */}
                <div className="animate-element animate-delay-250 flex gap-2 p-1 bg-muted/50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      loginMethod === "email"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-gray-400 hover:text-foreground"
                    }`}
                  >
                    Correo electrónico
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod("phone")}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                      loginMethod === "phone"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-gray-400 hover:text-foreground"
                    }`}
                  >
                    Celular
                  </button>
                </div>

                <div className="animate-element animate-delay-300 space-y-2">
                  <label className="text-sm font-medium text-gray-400">
                    {loginMethod === "email" ? "Correo electrónico" : "Número de celular"}
                  </label>
                  {loginMethod === "email" ? (
                    <GlassInputWrapper>
                      <input
                        name="email"
                        type="email"
                        placeholder="tu@correo.com"
                        className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none"
                        value={email}
                        onChange={(e) => setEmail(sanitizeEmail(e.target.value.toLowerCase()))}
                        maxLength={100}
                        pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                        autoComplete="email"
                        required
                      />
                    </GlassInputWrapper>
                  ) : (
                    <PhoneInput
                      value={email}
                      onChange={(val) => setEmail(val || '')}
                      placeholder="+57 300 123 4567"
                    />
                  )}
                </div>

                {usePassword && (
                  <div className="animate-element animate-delay-300 space-y-2">
                    <label className="text-sm font-medium text-gray-400">Contraseña</label>
                    <div className="rounded-2xl border dark:border-[#303030] bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-primary/50 focus-within:bg-primary/5">
                      <div className="flex items-center gap-2 px-4">
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Ingresa tu contraseña"
                          className="flex-1 bg-transparent text-sm py-4 focus:outline-none"
                          value={password}
                          onChange={(e) => setPassword(sanitizePassword(e.target.value))}
                          maxLength={100}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    {onForgotPassword && (
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={onForgotPassword}
                          className="text-sm text-gray-400 hover:text-foreground transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {error && <p className="text-sm text-red-500">{error}</p>}
                {message && <p className="text-sm text-green-600">{message}</p>}

                <button
                  type="submit"
                  className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-4 font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? (usePassword ? "Iniciando sesión..." : "Enviando...") : (usePassword ? "Iniciar sesión" : "Enviar código")}
                </button>

                <div className="animate-element animate-delay-650 text-center">
                  <button
                    type="button"
                    onClick={() => setUsePassword(!usePassword)}
                    className="text-sm text-gray-400 hover:text-foreground transition-colors underline"
                  >
                    {usePassword ? "Ingresar con código" : "Ingresar con contraseña"}
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-5" onSubmit={handleVerifyOtp}>
                <div className="animate-element animate-delay-300 space-y-2">
                  <label className="text-sm font-medium text-gray-400">Correo electrónico</label>
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
                  <label className="text-sm font-medium text-gray-400">Código de verificación</label>
                  <div className="flex gap-2 justify-between">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el }}
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
                    {canResend ? "Reenviar código" : `Reenviar en ${resendCountdown}s`}
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
              <>
                {(onGoogleSignIn || onAppleSignIn) && (
                  <>
                    <div className="animate-element animate-delay-700 relative flex items-center justify-center">
                      <span className="w-full border-t dark:border-[#303030]"></span>
                      <span className="px-4 text-sm text-gray-400 bg-background absolute">O continuar con</span>
                    </div>

                    <div className="space-y-3">
                      {onGoogleSignIn && (
                        <button
                          onClick={onGoogleSignIn}
                          className="animate-element animate-delay-800 w-full flex items-center justify-center gap-3 border dark:border-[#303030] rounded-2xl py-4 hover:bg-foreground/10 transition-colors"
                        >
                            <GoogleIcon />
                            Continuar con Google
                        </button>
                      )}

                      {/* {onAppleSignIn && (
                        <button
                          onClick={onAppleSignIn}
                          className="animate-element animate-delay-900 w-full flex items-center justify-center gap-3 border dark:border-[#303030] rounded-2xl py-4 hover:bg-foreground/10 transition-colors"
                        >
                            <AppleIcon />
                            Continuar con Apple
                        </button>
                      )} */}
                    </div>
                  </>
                )}

                <p className="animate-element animate-delay-1000 text-center text-sm text-gray-400">
                  ¿Nuevo en nuestra plataforma? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-foreground hover:underline transition-colors">Crear cuenta</a>
                </p>
              </>
            )}
          </div>
        </div>
  );
};

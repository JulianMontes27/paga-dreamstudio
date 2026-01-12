"use client";

import { useState, useEffect, useCallback } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "./toast";
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION,
} from "@/constants/profile";
import { validatePasswordStrength } from "@/lib/utils/profile";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

interface PasswordManagerProps {
  hasOAuthAccounts?: boolean;
}

// Translate Better Auth error messages to Spanish
function translateAuthError(errorMessage: string): string {
  const translations: Record<string, string> = {
    "Invalid password": "Contraseña incorrecta",
    "Password is too short": "La contraseña es muy corta",
    "Password is required": "La contraseña es requerida",
    "Current password is required": "La contraseña actual es requerida",
    "New password is required": "La nueva contraseña es requerida",
    "Passwords do not match": "Las contraseñas no coinciden",
  };

  return translations[errorMessage] || errorMessage;
}

export function PasswordManager({
  hasOAuthAccounts = false,
}: PasswordManagerProps) {
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [isChanging, setIsChanging] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Check if user has a password on mount
  useEffect(() => {
    const checkPassword = async () => {
      try {
        const accounts = await authClient.listAccounts();
        const hasCredentialAccount = accounts.data?.some(
          (account) => account.providerId === "credential"
        );
        setHasPassword(!!hasCredentialAccount);
      } catch (error) {
        console.error("Error checking password:", error);
        setHasPassword(false);
      }
    };

    void checkPassword();
  }, []);

  // Real-time password validation
  useEffect(() => {
    if (!newPassword) {
      setPasswordError(null);
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    setPasswordError(validation.isValid ? null : validation.error || null);
  }, [newPassword]);

  const handleSubmit = useCallback(async () => {
    if (newPassword !== confirmPassword) {
      toast.error({ title: ERROR_MESSAGES.PASSWORD_MISMATCH });
      return;
    }

    if (newPassword.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      toast.error({ title: ERROR_MESSAGES.PASSWORD_TOO_SHORT });
      return;
    }

    // Additional validation using utility function
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      toast.error({
        title: validation.error || ERROR_MESSAGES.PASSWORD_INVALID,
      });
      return;
    }

    setIsPending(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (error) {
        toast.error({
          title: error.message
            ? translateAuthError(error.message)
            : ERROR_MESSAGES.PASSWORD_CHANGE_FAILED,
        });
      } else {
        toast.success({
          title: revokeOtherSessions
            ? SUCCESS_MESSAGES.PASSWORD_CHANGED_WITH_REVOKE
            : SUCCESS_MESSAGES.PASSWORD_CHANGED,
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setRevokeOtherSessions(false);
        setPasswordError(null);
        setIsChanging(false);
      }
    } catch (error) {
      toast.error({ title: ERROR_MESSAGES.PASSWORD_CHANGE_FAILED });
      if (process.env.NODE_ENV === "development") {
        console.error("Error changing password:", error);
      }
    } finally {
      setIsPending(false);
    }
  }, [currentPassword, newPassword, confirmPassword, revokeOtherSessions]);

  const resetForm = useCallback(() => {
    setIsChanging(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setRevokeOtherSessions(false);
    setPasswordError(null);
  }, []);

  if (hasPassword === null) {
    return (
      <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px]">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="text-sm font-medium text-gray-500">Cargando...</span>
        </div>
      </div>
    );
  }

  if (!hasPassword) {
    return (
      <div
        className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors"
        role="region"
        aria-label="Información de contraseña"
      >
        <div className="flex items-center gap-3 mb-3">
          <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="text-sm font-medium">Contraseña</span>
        </div>
        <div className="pl-8 space-y-2">
          <p className="text-xs text-gray-400">
            {hasOAuthAccounts
              ? "Has iniciado sesión únicamente con OAuth (Google, etc.). No tienes una contraseña configurada."
              : "No tienes una contraseña configurada para tu cuenta."}
          </p>
          <p className="text-xs text-gray-400">
            <strong>Para agregar autenticación por contraseña:</strong> Usa la
            opción{" "}
            <Link
              href="/forgot-password"
              className="text-primary hover:underline font-medium"
            >
              &quot;Olvidé mi contraseña&quot;
            </Link>{" "}
            en la página de inicio de sesión.
          </p>
        </div>
      </div>
    );
  }

  if (isChanging) {
    return (
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium">Contraseña</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Current Password */}
          <div className="relative p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors">
            <Input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Contraseña actual"
              autoComplete="current-password"
              aria-label="Contraseña actual"
              className="h-6 w-full pr-8 bg-transparent border-none focus-visible:ring-0 text-sm font-medium p-0 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label={
                showCurrentPassword
                  ? "Ocultar contraseña actual"
                  : "Mostrar contraseña actual"
              }
              disabled={isPending}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* New Password */}
          <div className="relative p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors">
            <Input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nueva contraseña"
              autoComplete="new-password"
              aria-label="Nueva contraseña"
              aria-describedby={passwordError ? "password-error" : undefined}
              className="h-6 w-full pr-8 bg-transparent border-none focus-visible:ring-0 text-sm font-medium p-0 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label={
                showNewPassword
                  ? "Ocultar nueva contraseña"
                  : "Mostrar nueva contraseña"
              }
              disabled={isPending}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative p-3 rounded-lg border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmar contraseña"
              autoComplete="new-password"
              aria-label="Confirmar contraseña"
              className="h-6 w-full pr-8 bg-transparent border-none focus-visible:ring-0 text-sm font-medium p-0 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
              aria-label={
                showConfirmPassword
                  ? "Ocultar confirmación de contraseña"
                  : "Mostrar confirmación de contraseña"
              }
              disabled={isPending}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Password validation feedback */}
        {passwordError && (
          <div
            id="password-error"
            className="mt-2 text-xs text-red-500"
            role="alert"
          >
            {passwordError}
          </div>
        )}

        <div className="space-y-3 mt-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="revokeOtherSessions"
              checked={revokeOtherSessions}
              onCheckedChange={(checked) =>
                setRevokeOtherSessions(checked as boolean)
              }
            />
            <label
              htmlFor="revokeOtherSessions"
              className="text-xs font-medium leading-none cursor-pointer"
            >
              Cerrar sesión en otros dispositivos
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              onClick={resetForm}
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl"
              disabled={isPending}
              aria-label="Cancelar cambio de contraseña"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword ||
                !!passwordError
              }
              size="sm"
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Guardar nueva contraseña"
            >
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#1a1a1a] min-h-[72px] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#202020] transition-colors cursor-pointer group"
      role="region"
      aria-label="Configuración de contraseña"
    >
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium">Contraseña</p>
          <p
            className="text-xs text-gray-500 mt-1 leading-relaxed"
            aria-label="Contraseña oculta"
          >
            ••••••••••
          </p>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => setIsChanging(true)}
          className="text-sm font-medium hover:underline"
          aria-label="Actualizar contraseña"
        >
          Actualizar contraseña
        </button>
      </div>
    </div>
  );
}

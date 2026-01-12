"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2, Shield, Users, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";

interface InviteMemberFormProps {
  organizationId: string;
  onSuccess: () => void;
}

export function InviteMemberForm({
  organizationId,
  onSuccess,
}: InviteMemberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    email: string;
    role: "waiter" | "administrator" | "owner";
  }>({
    email: "",
    role: "waiter", // Default role
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await authClient.organization.inviteMember({
        email: formData.email,
        role: formData.role,
        organizationId: organizationId,
      });

      if (error) {
        console.error("Error inviting member:", error);
        toast.error(error.message || "Error al enviar la invitación");
        return;
      }

      if (data) {
        toast.success(`Invitación enviada a ${formData.email}`);
        router.refresh();
        onSuccess();
      }
    } catch (error) {
      console.error("Error inviting member:", error);
      toast.error("Error al enviar la invitación");
    } finally {
      setIsLoading(false);
    }
  };

  const roles: Array<{
    key: string;
    value: "waiter" | "administrator" | "owner";
    title: string;
    icon: typeof Users;
    description: string;
    permissions: string[];
  }> = [
    {
      key: "waiter",
      value: "waiter",
      title: "Vendedor",
      icon: Users,
      description: "Acceso básico para vender boletos",
      permissions: [
        "Ver eventos de la organización",
        "Vender boletos y gestionar órdenes",
        "Ver reportes de sus propias ventas",
      ],
    },
    {
      key: "administrator",
      value: "administrator",
      title: "Administrador",
      icon: Shield,
      description: "Gestión completa de eventos y equipo",
      permissions: [
        "Crear y editar eventos",
        "Invitar miembros al equipo",
        "Gestionar configuraciones generales",
        "Acceder a todos los reportes",
      ],
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email Input */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          Correo electrónico <span className="text-red-400">*</span>
        </Label>
        <div className="flex items-center p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-[#2a2a2a] dark:bg-[#202020] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#252525] transition-colors">
          <div className="flex items-center gap-3 flex-1">
            <Mail className="h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              disabled={isLoading}
              className="text-sm font-medium bg-transparent border-none outline-none focus:ring-0 w-full placeholder:text-gray-500 dark:placeholder:text-white/40"
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-white/40">
          El usuario recibirá un correo con la invitación
        </p>
      </div>

      {/* Role Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Selecciona un rol <span className="text-red-400">*</span>
        </Label>
        <div className="space-y-3">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = formData.role === role.value;

            return (
              <button
                key={role.key}
                type="button"
                onClick={() => setFormData({ ...formData, role: role.value })}
                disabled={isLoading}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "border-gray-300 dark:border-[#3a3a3a] bg-gray-100 dark:bg-[#252525]"
                    : "border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#202020] hover:border-gray-300 hover:bg-gray-100 dark:hover:border-[#3a3a3a] dark:hover:bg-[#252525]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-9 w-9 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? "bg-gray-200 dark:bg-white/[0.08]"
                        : "bg-gray-100 dark:bg-white/[0.05]"
                    }`}
                  >
                    <Icon className="h-4 w-4 text-gray-700 dark:text-white/70" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{role.title}</h4>
                      {isSelected && (
                        <CheckCircle2 className="h-4 w-4 text-gray-700 dark:text-white/70" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-white/50 mb-2">
                      {role.description}
                    </p>
                    <ul className="space-y-1">
                      {role.permissions.map((permission, index) => (
                        <li
                          key={index}
                          className="text-xs text-gray-500 dark:text-white/40 flex items-start gap-1.5"
                        >
                          <span className="text-gray-400 dark:text-white/30 mt-0.5">
                            •
                          </span>
                          <span>{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button
          type="submit"
          disabled={isLoading || !formData.email}
          className="w-full bg-white/90 hover:bg-white text-black dark:bg-white/90 dark:hover:bg-white dark:text-black"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando invitación...
            </>
          ) : (
            "Enviar Invitación"
          )}
        </Button>
      </div>
    </form>
  );
}

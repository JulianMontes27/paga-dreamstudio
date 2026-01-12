import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, Bell, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { redirect, notFound } from "next/navigation";
import PaymentSettings from "@/components/payment-settings";
import { db } from "@/db";
import { organization, member } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function OrganizationSettings({
  params,
}: {
  params: Promise<{ userId: string; orgId: string }>;
}) {
  const { userId, orgId } = await params;

  const org = await db
    .select()
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!org) {
    notFound();
  }

  // Fetch current user's membership
  const userMembership = await db
    .select()
    .from(member)
    .where(
      and(eq(member.organizationId, org.id), eq(member.userId, userId))
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!userMembership) {
    redirect(`/${userId}/organizaciones`);
  }

  const userRole = userMembership.role;

  // Check if user has permission to view settings (only owners and admins)
  if (userRole !== "owner" && userRole !== "administrator") {
    redirect(`/${userId}/organizaciones/${orgId}`);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra la configuración de tu organización
        </p>
      </div>

      <div className="grid gap-5">
        {/* General Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              Configuración General
            </CardTitle>
            <CardDescription className="text-xs">
              Información básica de tu restaurante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Nombre del Restaurante
                </label>
                <p className="text-sm font-medium mt-1">{org?.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  ID
                </label>
                <p className="text-sm font-medium mt-1">{org.id}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Editar Información
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notificaciones
            </CardTitle>
            <CardDescription className="text-xs">
              Configura tus preferencias de notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">
                    Notificaciones de Pedidos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Recibe notificaciones de nuevos pedidos
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Reportes por Email</p>
                  <p className="text-xs text-muted-foreground">
                    Reportes diarios y semanales
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Seguridad
            </CardTitle>
            <CardDescription className="text-xs">
              Configuración de seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">
                    Autenticación de Dos Factores
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Seguridad adicional para tu cuenta
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configurar
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Acceso API</p>
                  <p className="text-xs text-muted-foreground">
                    Administra tus claves de API
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Administrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <PaymentSettings org={org} />

        {/* Billing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              Facturación
            </CardTitle>
            <CardDescription className="text-xs">
              Administra tu plan y métodos de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Plan Actual</p>
                  <p className="text-xs text-muted-foreground">Plan Gratuito</p>
                </div>
                <Button variant="outline" size="sm">
                  Mejorar Plan
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Método de Pago</p>
                  <p className="text-xs text-muted-foreground">
                    Sin método de pago configurado
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Agregar Método
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

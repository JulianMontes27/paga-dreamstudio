import Link from "next/link";
import { AlertCircle, ArrowLeft, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error;

  // Map error codes to user-friendly messages
  const getErrorMessage = (errorCode: string | null | undefined) => {
    const errorMessages: { [key: string]: { title: string; message: string } } =
      {
        email_doesn_t_match: {
          title: "Los correos no coinciden",
          message:
            "La cuenta de Google que intentas vincular usa un correo electrónico diferente al de tu cuenta actual. Por seguridad, solo puedes vincular cuentas con el mismo correo electrónico.",
        },
        account_already_linked: {
          title: "Cuenta ya vinculada",
          message:
            "Esta cuenta de Google ya está vinculada a tu perfil o a otro usuario.",
        },
        provider_not_found: {
          title: "Proveedor no encontrado",
          message: "El proveedor de autenticación no está configurado.",
        },
        unauthorized: {
          title: "No autorizado",
          message: "No tienes permiso para realizar esta acción.",
        },
        default: {
          title: "Error de autenticación",
          message:
            "Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.",
        },
      };

    // Clean up the error code (remove quotes if present)
    const cleanedError = errorCode?.replace(/['"%]/g, "") || "default";
    return errorMessages[cleanedError] || errorMessages.default;
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-background/50 backdrop-blur-sm border-[#303030]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl" style={{ fontFamily: "LOT, sans-serif" }}>
            {errorInfo.title}
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {errorInfo.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error?.includes("email") && (
            <div className="rounded-lg border border-[#303030] bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <Link2 className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sugerencia</p>
                  <p className="text-sm text-muted-foreground">
                    Asegúrate de usar la cuenta de Google que tiene el mismo
                    correo electrónico que tu cuenta de Hunt Tickets. Si tienes
                    varias cuentas de Google, selecciona la correcta durante el
                    proceso de autenticación.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a mi perfil
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Ir al inicio</Link>
            </Button>
          </div>

          {error && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Código de error: <code className="font-mono">{error}</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

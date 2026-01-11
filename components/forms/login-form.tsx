"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { signIn } from "@/server/users";

import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const passwordFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const otpEmailSchema = z.object({
  email: z.string().email(),
});

const otpVerifySchema = z.object({
  otp: z.string().length(6, "El código debe tener 6 dígitos"),
});

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");

  const router = useRouter();

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const otpEmailForm = useForm<z.infer<typeof otpEmailSchema>>({
    resolver: zodResolver(otpEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const otpVerifyForm = useForm<z.infer<typeof otpVerifySchema>>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: {
      otp: "",
    },
  });

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  async function onPasswordSubmit(values: z.infer<typeof passwordFormSchema>) {
    setIsLoading(true);

    const { success, message } = await signIn(values.email, values.password);

    if (success) {
      toast.success(message as string);
      router.push("/dashboard");
    } else {
      toast.error(message as string);
    }

    setIsLoading(false);
  }

  async function onSendOtp(values: z.infer<typeof otpEmailSchema>) {
    setIsLoading(true);

    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email: values.email,
      type: "sign-in",
    });

    if (error) {
      toast.error(error.message || "Error al enviar el código");
    } else {
      setOtpEmail(values.email);
      setOtpSent(true);
      toast.success("Código enviado a tu correo");
    }

    setIsLoading(false);
  }

  async function onVerifyOtp(values: z.infer<typeof otpVerifySchema>) {
    setIsLoading(true);

    const { error } = await authClient.signIn.emailOtp({
      email: otpEmail,
      otp: values.otp,
    });

    if (error) {
      toast.error(error.message || "Código inválido");
    } else {
      toast.success("Sesión iniciada");
      window.location.href = "/dashboard";
    }

    setIsLoading(false);
  }

  function resetOtpFlow() {
    setOtpSent(false);
    setOtpEmail("");
    otpVerifyForm.reset();
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenido</CardTitle>
          <CardDescription>Inicia sesión en tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <Button
              variant="outline"
              className="w-full"
              type="button"
              onClick={signInWithGoogle}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continuar con Google
            </Button>

            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                O continúa con
              </span>
            </div>

            <Tabs defaultValue="otp" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="otp">Código por email</TabsTrigger>
                <TabsTrigger value="password">Contraseña</TabsTrigger>
              </TabsList>

              <TabsContent value="otp" className="mt-4">
                {!otpSent ? (
                  <Form {...otpEmailForm}>
                    <form
                      onSubmit={otpEmailForm.handleSubmit(onSendOtp)}
                      className="grid gap-4"
                    >
                      <FormField
                        control={otpEmailForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="tu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Enviar código"
                        )}
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <Form {...otpVerifyForm}>
                    <form
                      onSubmit={otpVerifyForm.handleSubmit(onVerifyOtp)}
                      className="grid gap-4"
                    >
                      <p className="text-sm text-muted-foreground text-center">
                        Código enviado a <strong>{otpEmail}</strong>
                      </p>
                      <FormField
                        control={otpVerifyForm.control}
                        name="otp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de verificación</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123456"
                                maxLength={6}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Verificar"
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full"
                        onClick={resetOtpFlow}
                      >
                        Usar otro email
                      </Button>
                    </form>
                  </Form>
                )}
              </TabsContent>

              <TabsContent value="password" className="mt-4">
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="grid gap-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="tu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-2">
                      <FormField
                        control={passwordForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contraseña</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="********"
                                type="password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Link
                        href="/forgot-password"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Iniciar sesión"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <div className="text-center text-sm">
              ¿No tienes cuenta?{" "}
              <Link href="/signup" className="underline underline-offset-4">
                Regístrate
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        Al continuar, aceptas nuestros{" "}
        <Link href="#">Términos de Servicio</Link> y{" "}
        <Link href="#">Política de Privacidad</Link>.
      </div>
    </div>
  );
}

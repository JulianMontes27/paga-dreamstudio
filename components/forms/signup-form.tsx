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
import { signUp } from "@/server/users";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

const formSchema = z.object({
  username: z.string().min(3),
  email: z.email(),
  password: z.string().min(8),
});

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const { success, message } = await signUp(
      values.email,
      values.password,
      values.username
    );

    // Change the screen to a check your email
    if (success) {
      setUserEmail(values.email);
      setSuccess(true);
    } else {
      toast.error(message as string);
    }

    setIsLoading(false);
  }

  // Show email confirmation UI after successful signup
  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="relative">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 w-20 h-20 bg-green-500/20 rounded-full blur-xl mx-auto left-0 right-0" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold">
                📧 Check your inbox
              </CardTitle>
              <CardDescription className="text-base px-4">
                Verification sent to
                <div className="mt-2 font-mono text-sm bg-muted px-3 py-2 rounded-lg inline-block">
                  {userEmail}
                </div>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted/50 to-transparent" />
              <div className="relative bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-xl p-4 border border-green-500/20">
                <p className="text-center text-sm font-medium">
                  ✨ Click the link in your email to activate your account
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setSuccess(false);
                  form.reset();
                }}
              >
                Wrong email? Try again
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Can&apos;t find it? Check your spam folder
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome to Tip</CardTitle>
          <CardDescription>Signup with your Google account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-6">
                <div className="flex flex-col gap-4">
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
                    Signup with Google
                  </Button>
                </div>
                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                  <span className="bg-card text-muted-foreground relative z-10 px-2">
                    Or continue with
                  </span>
                </div>
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="shadcn" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="m@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid gap-3">
                    <div className="flex flex-col gap-2">
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="********"
                                {...field}
                                type="password"
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
                        Forgot your password?
                      </Link>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Signup"
                    )}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Login
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our{" "}
        <Link href="#">Terms of Service</Link> and{" "}
        <Link href="#">Privacy Policy</Link>.
      </div>
    </div>
  );
}

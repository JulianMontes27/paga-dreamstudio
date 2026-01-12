import { AuthForgotPassword } from "@/components/auth-forgot-password";
import { Suspense } from "react";

export default function RouteComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForgotPassword />
    </Suspense>
  );
}

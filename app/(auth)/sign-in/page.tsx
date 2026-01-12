import { AuthSignIn } from "@/components/auth-sign-in";
import { Suspense } from "react";

export default function RouteComponent() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthSignIn />
    </Suspense>
  );
}

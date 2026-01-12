import { Suspense } from "react";
import { AuthSignUp } from "@/components/auth-sign-up";

export default function RouteComponent() {
  return (
    <Suspense fallback={<div className="w-full max-w-md animate-pulse">
      <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded mb-8"></div>
      <div className="space-y-4">
        <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded"></div>
      </div>
    </div>}>
      <AuthSignUp />
    </Suspense>
  );
}

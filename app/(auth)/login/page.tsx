import Link from "next/link";

import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex flex-col items-center gap-2 self-center"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <span className="text-2xl font-bold tracking-tight">Tip</span>
          </div>
          <p className="text-sm text-muted-foreground">Restaurant Management Platform</p>
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}

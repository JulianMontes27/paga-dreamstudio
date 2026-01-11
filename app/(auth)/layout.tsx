import React, { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { ModeSwitcher } from "@/components/mode-switcher";

const AuthPagesLayout = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="auth-theme"
    >
      <div className="relative min-h-screen">
        <div className="absolute top-4 right-4 z-10">
          <ModeSwitcher />
        </div>
        {children}
      </div>
    </ThemeProvider>
  );
};

export default AuthPagesLayout;

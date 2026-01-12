"use client";

import { ReactNode } from "react";
import { AdminMenuProvider } from "@/contexts/admin-menu-context";

interface AdminLayoutWrapperProps {
  children: ReactNode;
}

export function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return <AdminMenuProvider>{children}</AdminMenuProvider>;
}

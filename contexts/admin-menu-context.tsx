"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AdminMenuContextValue {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
}

const AdminMenuContext = createContext<AdminMenuContextValue | undefined>(undefined);

export function useAdminMenu() {
  const context = useContext(AdminMenuContext);
  if (context === undefined) {
    throw new Error("useAdminMenu must be used within AdminMenuProvider");
  }
  return context;
}

export function AdminMenuProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);

  return (
    <AdminMenuContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen, toggleMobileMenu }}>
      {children}
    </AdminMenuContext.Provider>
  );
}

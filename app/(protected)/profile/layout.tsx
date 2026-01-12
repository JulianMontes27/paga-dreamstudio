"use client";

import { ReactNode } from "react";
import ProfileTabs from "@/components/profile_layout_tabs_switch";

const ProtectedLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-background">
      <main className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-6 sm:pb-8">
        <div className="space-y-6">
          <ProfileTabs />
          {children}
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;

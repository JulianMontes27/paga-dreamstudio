import { ReactNode } from "react";
import ProfileTabs from "@/components/profile_layout_tabs_switch";

const ProtectedLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="bg-background">
      <main className="container mx-auto ">
        <div className="space-y-6">
          <ProfileTabs />
          {children}
        </div>
      </main>
    </div>
  );
};

export default ProtectedLayout;

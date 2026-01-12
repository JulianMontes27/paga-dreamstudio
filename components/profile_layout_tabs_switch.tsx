"use client";

import { usePathname, useRouter } from "next/navigation";
import { User, Building2 } from "lucide-react";
import { useEffect, useRef } from "react";

const ProfileTabs = () => {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);

  // Extract userId from pathname: /profile/[userId]/[tab]
  const pathSegments = pathname.split("/").filter(Boolean);
  const userId = pathSegments[1]; // Gets userId from /profile/[userId]/...

  // Fix for Safari's dynamic viewport
  useEffect(() => {
    // Only run on iOS devices
    if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) return;

    let rafId: number;
    let lastBottom = -1;

    const updatePosition = () => {
      // Cancel any pending frame
      if (rafId) cancelAnimationFrame(rafId);

      // Use requestAnimationFrame to batch updates with browser paint cycle
      rafId = requestAnimationFrame(() => {
        if (!navRef.current) return;

        const vh = window.visualViewport?.height || window.innerHeight;
        const newBottom = window.innerHeight - vh;

        // Only update if value actually changed (avoid unnecessary reflows)
        if (newBottom !== lastBottom) {
          navRef.current.style.bottom = `${newBottom}px`;
          lastBottom = newBottom;
        }
      });
    };

    updatePosition();

    // Only listen to resize (fires when toolbar shows/hides)
    // Removed 'scroll' listener - resize is sufficient
    window.visualViewport?.addEventListener("resize", updatePosition);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.visualViewport?.removeEventListener("resize", updatePosition);
    };
  }, []);

  // Determine current tab from pathname
  const getCurrentTab = () => {
    if (pathname.includes("/organizaciones")) return "organizaciones";

    return "general";
  };

  const currentTab = getCurrentTab();

  const handleTabChange = (value: string) => {
    if (value === "general") {
      router.push(`/${userId}`);
    } else {
      router.push(`/${userId}/${value}`);
    }
  };

  const tabs = [
    { value: "general", icon: User, label: "General" },
    { value: "organizaciones", icon: Building2, label: "Organizaciones" },
  ];

  return (
    <>
      {/* Desktop: Admin-style tabs */}
      <div className="hidden md:flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                isActive
                  ? "bg-gray-200 text-gray-900 border border-gray-300 dark:bg-[#2a2a2a] dark:text-white dark:border-[#3a3a3a]"
                  : "bg-gray-50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200 dark:bg-[#1a1a1a] dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-[#2a2a2a] dark:border-[#2a2a2a]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Mobile: Fixed bottom navigation */}
      <div
        ref={navRef}
        data-profile-menu-bar
        className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-background/95 backdrop-blur-md border-t border-gray-200 dark:border-[#303030] z-50 grid grid-cols-3 pb-3 pt-3 transition-all duration-100"
        style={{
          paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`
                flex flex-col items-center justify-center gap-1
                transition-all duration-300
                ${isActive ? "text-primary" : "text-foreground/70"}
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ProfileTabs;

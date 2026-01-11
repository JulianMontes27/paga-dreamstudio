"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  name: string;
  href: string;
}

interface TabLinkProps {
  tab: Tab;
}

const TabLink = ({ tab }: TabLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === tab.href;

  return (
    <Link
      key={tab.name}
      href={tab.href}
      className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
        isActive
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      }`}
    >
      {tab.name}
    </Link>
  );
};

export default TabLink;

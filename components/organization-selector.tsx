"use client";

import { useState } from "react";
import { Building2, Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: Date | string;
}

interface OrganizationSelectorProps {
  organizations: Organization[];
  selectedOrgId?: string;
  onSelectOrganization?: (orgId: string) => void;
}

export function OrganizationSelector({
  organizations,
  selectedOrgId,
  onSelectOrganization,
}: OrganizationSelectorProps) {
  const [selectedId, setSelectedId] = useState(selectedOrgId);

  const selectedOrg = organizations.find((org) => org.id === selectedId);

  const handleSelect = (orgId: string) => {
    setSelectedId(orgId);
    onSelectOrganization?.(orgId);
  };

  if (organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="w-full flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {selectedOrg?.logo ? (
              <img
                src={selectedOrg.logo}
                alt={selectedOrg.name}
                className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {selectedOrg?.name || "Seleccionar organización"}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-white/50 flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-[#202020]/95 backdrop-blur-md shadow-lg"
        sideOffset={8}
      >
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSelect(org.id)}
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg"
          >
            {org.logo ? (
              <img
                src={org.logo}
                alt={org.name}
                className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {org.name}
              </p>
            </div>
            {selectedId === org.id && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

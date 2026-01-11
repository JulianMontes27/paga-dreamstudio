"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronDown, Plus, Check, Building2, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CreateOrganizationForm } from "./forms/create-organization-form";
import { authClient } from "@/lib/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface OrganizationSwitcherProps {
  organizations: {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    logo?: string | null | undefined;
    metadata?: Record<string, unknown>;
  }[];
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null | undefined;
    createdAt: Date;
    updatedAt: Date;
  };
}

const OrganizationSwitcher: React.FC<OrganizationSwitcherProps> = ({
  organizations,
  user,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Benefits:
  // - URL always determines what's shown
  // - Consistent across all components
  // - User can bookmark/share specific org URLs
  // - No sync issues

  // Keep session switching for:
  // - Setting default org on login
  // - Future server-side operations
  // - Organization permissions
  const urlSlug = pathname.split("/")[2]; // Extract from /dashboard/[slug]/...
  const currentOrg = organizations.find((org) => org.slug === urlSlug);

  // Get current active organization (reactive)
  const { data: activeOrg } = authClient.useActiveOrganization();

  // The activeOrg hook will automatically update!
  const handleSwitchOrganization = async (organizationId: string) => {
    try {
      // Makes a post request to /organization/set-active to modify the Session's active_organization_id
      const { error } = await authClient.organization.setActive({
        organizationId,
      });

      if (error) {
        toast.error("Failed to switch organization");
        return;
      }

      // Find the organization by ID to get its slug
      const selectedOrg = organizations.find(
        (org) => org.id === organizationId
      );
      const slug = selectedOrg?.slug || organizationId;

      toast.success("Organization switched successfully");
      router.push(`/dashboard/${slug}/tables`);
      setIsOpen(false);
    } catch {
      toast.error("Failed to switch organization");
    }
  };

  const handleCreateOrganization = () => {
    setIsCreateDialogOpen(true);
    setIsOpen(false);
  };

  const getOrganizationInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 px-2 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              {currentOrg?.logo ? (
                <Image
                  src={currentOrg.logo}
                  alt={currentOrg.name}
                  width={20}
                  height={20}
                  className="rounded-md object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[10px] font-semibold text-white">
                  {currentOrg ? (
                    `${getOrganizationInitials(currentOrg.name)}`
                  ) : (
                    <Building2 className="w-3 h-3" />
                  )}
                </div>
              )}
              <span className="text-sm font-medium max-w-[150px] truncate">
                {currentOrg?.name || `${user.name}'s Restaurants`}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform text-muted-foreground",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-[240px]">
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            {user.email}
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Restaurants
          </DropdownMenuLabel>

          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitchOrganization(org.id)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  {org.logo ? (
                    <Image
                      src={org.logo}
                      alt={org.name}
                      width={16}
                      height={16}
                      className="rounded object-cover"
                    />
                  ) : (
                    <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-[8px] font-semibold text-white">
                      {getOrganizationInitials(org.name)}
                    </div>
                  )}
                  <span className="text-sm">{org.name}</span>
                </div>
                {org.id === activeOrg?.id && (
                  <Check className="h-3 w-3 text-blue-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleCreateOrganization}
            className="cursor-pointer"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="text-sm">Create Restaurant</span>
          </DropdownMenuItem>

          {activeOrg && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/${activeOrg.slug}/settings`)
                }
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span className="text-sm">Restaurant Settings</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Restaurant</DialogTitle>
          </DialogHeader>
          <CreateOrganizationForm
            onSuccess={() => {
              setIsCreateDialogOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrganizationSwitcher;

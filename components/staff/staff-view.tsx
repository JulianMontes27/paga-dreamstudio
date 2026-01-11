"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, X, Users, MoreHorizontal, Shield, UserMinus } from "lucide-react";

interface Member {
  id: string;
  role: "member" | "admin" | "owner";
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  inviterUser: {
    name: string;
  } | null;
}

interface StaffViewProps {
  members: Member[];
  invitations: Invitation[];
  currentUserId: string;
  currentUserRole: "member" | "admin" | "owner";
  organizationId: string;
}

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner", color: "bg-purple-500" },
  { value: "admin", label: "Admin", color: "bg-blue-500" },
  { value: "member", label: "Member", color: "bg-gray-500" },
] as const;

export function StaffView({
  members,
  invitations,
  currentUserId,
  currentUserRole,
}: StaffViewProps) {
  const [roleFilter, setRoleFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "invitations">("members");

  const clearAllFilters = () => {
    setRoleFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = roleFilter || searchQuery;

  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Role filter
    if (roleFilter) {
      filtered = filtered.filter((member) => member.role === roleFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((member) => {
        return (
          member.user.name.toLowerCase().includes(query) ||
          member.user.email.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [members, roleFilter, searchQuery]);

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");

  const getRoleConfig = (role: string) => {
    return ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[2];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "members"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Members ({members.length})
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "invitations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Pending Invitations ({pendingInvitations.length})
        </button>
      </div>

      {activeTab === "members" && (
        <>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Select
                value={roleFilter || "all"}
                onValueChange={(v) => setRoleFilter(v === "all" ? "" : v)}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${role.color}`} />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="ghost" size="icon" onClick={clearAllFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-muted-foreground">
            {filteredMembers.length} member{filteredMembers.length !== 1 && "s"}
            {hasActiveFilters && " found"}
          </div>

          {/* Members List */}
          {filteredMembers.length > 0 ? (
            <div className="border rounded-lg divide-y">
              {filteredMembers.map((member) => {
                const roleConfig = getRoleConfig(member.role);
                const isCurrentUser = member.user.id === currentUserId;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4"
                  >
                    {/* Avatar */}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.user.image || undefined} />
                      <AvatarFallback>
                        {member.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Member info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {member.user.name}
                        </span>
                        {isCurrentUser && (
                          <Badge variant="outline" className="text-xs">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {member.user.email}
                      </div>
                    </div>

                    {/* Role badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${roleConfig.color}`}
                      />
                      <Badge variant="secondary" className="capitalize">
                        {member.role}
                      </Badge>
                    </div>

                    {/* Joined date */}
                    <div className="hidden sm:block text-sm text-muted-foreground">
                      Joined {formatDate(member.createdAt)}
                    </div>

                    {/* Actions */}
                    {canManageMembers && !isCurrentUser && member.role !== "owner" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <UserMinus className="h-4 w-4 mr-2" />
                            Remove Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">No team members</h3>
              <p className="text-sm text-muted-foreground">
                Invite members to your organization to get started.
              </p>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">No members found</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Try adjusting your search or filters.
              </p>
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </>
      )}

      {activeTab === "invitations" && (
        <>
          {/* Invitations List */}
          {pendingInvitations.length > 0 ? (
            <div className="border rounded-lg divide-y">
              {pendingInvitations.map((invitation) => {
                const roleConfig = getRoleConfig(invitation.role);
                const isExpired = new Date(invitation.expiresAt) < new Date();

                return (
                  <div
                    key={invitation.id}
                    className="flex items-center gap-4 p-4"
                  >
                    {/* Avatar placeholder */}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {invitation.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Invitation info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {invitation.email}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Invited by {invitation.inviterUser?.name || "Unknown"}
                      </div>
                    </div>

                    {/* Role badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${roleConfig.color}`}
                      />
                      <Badge variant="secondary" className="capitalize">
                        {invitation.role}
                      </Badge>
                    </div>

                    {/* Status */}
                    <Badge variant={isExpired ? "destructive" : "outline"}>
                      {isExpired ? "Expired" : "Pending"}
                    </Badge>

                    {/* Actions */}
                    {canManageMembers && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            Resend Invitation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            Cancel Invitation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">No pending invitations</h3>
              <p className="text-sm text-muted-foreground">
                All invitations have been accepted or expired.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

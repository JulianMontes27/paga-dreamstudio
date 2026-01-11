"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Clock,
  Globe,
  Smartphone,
  MapPin,
  Activity,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

/**
 * Account Details Section Component
 *
 * This component displays comprehensive account status information including
 * security indicators, current session details, account verification status,
 * and other important account metrics.
 *
 * Features:
 * - Account verification status with visual indicators
 * - Current session information (IP, device, location)
 * - Account security status overview
 * - Real-time session activity display
 * - Responsive design with proper accessibility
 */

interface AccountDetailsSectionProps {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
  currentSession: {
    id: string;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    activeOrganizationId: string | null;
  };
}

export function AccountDetailsSection({
  user,
  currentSession,
}: AccountDetailsSectionProps) {
  /**
   * Parses user agent string to extract device and browser information
   * This provides users with readable information about their current session
   */
  const parseUserAgent = () => {
    if (!currentSession.userAgent) {
      return {
        browser: "Unknown Browser",
        os: "Unknown OS",
        device: "Unknown Device",
      };
    }

    const userAgent = currentSession.userAgent;

    // Extract browser information
    let browser = "Unknown Browser";
    if (userAgent.includes("Chrome")) browser = "Google Chrome";
    else if (userAgent.includes("Firefox")) browser = "Mozilla Firefox";
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      browser = "Safari";
    else if (userAgent.includes("Edge")) browser = "Microsoft Edge";
    else if (userAgent.includes("Opera")) browser = "Opera";

    // Extract OS information
    let os = "Unknown OS";
    if (userAgent.includes("Windows")) os = "Windows";
    else if (userAgent.includes("Mac OS")) os = "macOS";
    else if (userAgent.includes("Linux")) os = "Linux";
    else if (userAgent.includes("Android")) os = "Android";
    else if (userAgent.includes("iOS")) os = "iOS";

    // Extract device type
    let device = "Desktop";
    if (userAgent.includes("Mobile")) device = "Mobile";
    else if (userAgent.includes("Tablet")) device = "Tablet";

    return { browser, os, device };
  };

  /**
   * Formats session expiry time for display
   */
  const formatExpiryTime = () => {
    const now = new Date();
    const expiry = new Date(currentSession.expiresAt);
    const diffInHours = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return "Less than 1 hour";
    } else if (diffInHours < 24) {
      return `${diffInHours} hours`;
    } else {
      const days = Math.ceil(diffInHours / 24);
      return `${days} days`;
    }
  };

  /**
   * Determines account security level based on various factors
   */
  const getSecurityLevel = () => {
    let score = 0;
    const issues: string[] = [];

    // Email verification
    if (user.emailVerified) {
      score += 30;
    } else {
      issues.push("Email not verified");
    }

    // Recent activity (session age)
    const sessionAge = new Date().getTime() - new Date(currentSession.createdAt).getTime();
    const hoursOld = sessionAge / (1000 * 60 * 60);
    if (hoursOld < 24) {
      score += 20;
    }

    // Profile completeness
    if (user.name && user.name.trim().length > 0) {
      score += 15;
    } else {
      issues.push("Profile incomplete");
    }

    // Session security (IP tracking)
    if (currentSession.ipAddress) {
      score += 15;
    }

    // Account age (older accounts tend to be more established)
    const accountAge = new Date().getTime() - new Date(user.createdAt).getTime();
    const daysOld = accountAge / (1000 * 60 * 60 * 24);
    if (daysOld > 7) {
      score += 20;
    }

    if (score >= 80) {
      return { level: "High", variant: "default" as const, issues };
    } else if (score >= 60) {
      return { level: "Medium", variant: "secondary" as const, issues };
    } else {
      return { level: "Low", variant: "destructive" as const, issues };
    }
  };

  const deviceInfo = parseUserAgent();
  const securityStatus = getSecurityLevel();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Account Details
        </CardTitle>
        <CardDescription>
          Current session information and account security status
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Security Status Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Security Level</span>
            <Badge variant={securityStatus.variant} className="flex items-center gap-1">
              {securityStatus.level === "High" ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              {securityStatus.level}
            </Badge>
          </div>

          {securityStatus.issues.length > 0 && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm font-medium mb-2">Recommended Actions:</p>
              <ul className="text-xs space-y-1">
                {securityStatus.issues.map((issue, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-muted-foreground" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Separator />

        {/* Current Session Information */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Current Session
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Device</p>
                  <p className="text-xs text-muted-foreground">
                    {deviceInfo.device} • {deviceInfo.browser}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Operating System</p>
                  <p className="text-xs text-muted-foreground">{deviceInfo.os}</p>
                </div>
              </div>
            </div>

            {/* Session Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">IP Address</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {currentSession.ipAddress || "Not recorded"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Session Expires</p>
                  <p className="text-xs text-muted-foreground">
                    In {formatExpiryTime()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Account Verification Status */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Account Verification</h4>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    user.emailVerified ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="text-sm">Email Verification</span>
              </div>
              <Badge variant={user.emailVerified ? "default" : "destructive"}>
                {user.emailVerified ? "Verified" : "Pending"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm">Account Active</span>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </div>

        {/* Session Metadata */}
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p>Session ID: {currentSession.id}</p>
          <p>
            Session started: {new Date(currentSession.createdAt).toLocaleString()}
          </p>
          {currentSession.activeOrganizationId && (
            <p>Active Organization: {currentSession.activeOrganizationId}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
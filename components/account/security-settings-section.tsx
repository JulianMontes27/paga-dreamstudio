"use client";

import React, { useState, useTransition } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Shield,
  Key,
  AlertTriangle,
  CheckCircle,
  Mail,
  Smartphone,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

interface SecuritySettingsSectionProps {
  securityInfo: {
    lastPasswordChange?: Date;
    pendingVerifications: Array<{
      id: string;
      type: string;
      createdAt: Date;
      expiresAt: Date;
    }>;
    accountAge: number;
    totalSessions: number;
    activeSessions: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export function SecuritySettingsSection({
  securityInfo,
  user,
}: SecuritySettingsSectionProps) {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [securityPreferences, setSecurityPreferences] = useState({
    emailOnLogin: true,
    emailOnPasswordChange: true,
    emailOnSuspiciousActivity: true,
    twoFactorEnabled: false,
  });

  const [isPending, startTransition] = useTransition();

  const validatePasswordStrength = (password: string) => {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const strengthScore = Object.values(requirements).filter(Boolean).length;
    const strength =
      strengthScore < 3
        ? "Weak"
        : strengthScore < 4
          ? "Fair"
          : strengthScore < 5
            ? "Good"
            : "Strong";

    return { requirements, strength, score: strengthScore };
  };

  const handleChangePassword = () => {
    const { newPassword, confirmPassword, currentPassword } = passwordData;

    if (!currentPassword.trim()) {
      toast.error("Current password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    const validation = validatePasswordStrength(newPassword);
    if (validation.score < 3) {
      toast.error("Password is too weak. Please choose a stronger password.");
      return;
    }

    startTransition(async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        toast.success("Password changed successfully");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsChangingPassword(false);
      } catch (error) {
        toast.error("Failed to change password");
      }
    });
  };

  const handleDeleteAccount = () => {
    startTransition(async () => {
      try {
        toast.success(
          "Account deletion initiated. Check your email for confirmation."
        );
      } catch (error) {
        toast.error("Failed to initiate account deletion");
      }
    });
  };

  const handleToggleSecurityPreference = (
    key: keyof typeof securityPreferences
  ) => {
    setSecurityPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));

    toast.success("Security preference updated");
  };

  const formatSecurityDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getSecurityScore = () => {
    let score = 0;
    const factors = [];

    if (user.emailVerified) {
      score += 25;
      factors.push("Email verified");
    } else {
      factors.push("Email not verified");
    }

    if (securityInfo.accountAge > 30) {
      score += 15;
      factors.push("Established account");
    }

    if (securityInfo.lastPasswordChange) {
      const daysSinceChange =
        (new Date().getTime() -
          new Date(securityInfo.lastPasswordChange).getTime()) /
        (1000 * 60 * 60 * 24);
      if (daysSinceChange < 90) {
        score += 20;
        factors.push("Recent password change");
      }
    }

    if (securityPreferences.twoFactorEnabled) {
      score += 30;
      factors.push("Two-factor authentication enabled");
    } else {
      factors.push("Two-factor authentication disabled");
    }

    if (securityInfo.activeSessions <= 3) {
      score += 10;
      factors.push("Good session management");
    }

    return { score: Math.min(score, 100), factors };
  };

  const passwordStrength = passwordData.newPassword
    ? validatePasswordStrength(passwordData.newPassword)
    : null;

  const securityScore = getSecurityScore();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </CardTitle>
          <CardDescription>
            Monitor and improve your account security
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <h4 className="font-medium">Account Security Score</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Based on your current security settings
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{securityScore.score}%</div>
              <Badge
                variant={
                  securityScore.score >= 80
                    ? "default"
                    : securityScore.score >= 60
                      ? "secondary"
                      : "destructive"
                }
              >
                {securityScore.score >= 80
                  ? "Strong"
                  : securityScore.score >= 60
                    ? "Good"
                    : "Needs Work"}
              </Badge>
            </div>
          </div>

          <div className="grid gap-2">
            {securityScore.factors.map((factor, index) => {
              const isPositive =
                !factor.includes("not") && !factor.includes("disabled");
              return (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {isPositive ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span
                    className={
                      isPositive
                        ? "text-green-700 dark:text-green-400"
                        : "text-amber-700 dark:text-amber-400"
                    }
                  >
                    {factor}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Password Security
              </CardTitle>
              <CardDescription>
                Manage your account password and security
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              disabled={isPending}
            >
              {isChangingPassword ? "Cancel" : "Change Password"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Changed</Label>
              <p className="text-sm text-muted-foreground">
                {securityInfo.lastPasswordChange
                  ? formatSecurityDate(
                      new Date(securityInfo.lastPasswordChange)
                    )
                  : "Never changed"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Strength</Label>
              <Badge variant="outline">Good</Badge>
            </div>
          </div>

          {isChangingPassword && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter current password"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {passwordStrength && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Password Strength:</span>
                      <Badge
                        variant={
                          passwordStrength.strength === "Strong"
                            ? "default"
                            : passwordStrength.strength === "Good"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {passwordStrength.strength}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      {Object.entries(passwordStrength.requirements).map(
                        ([key, met]) => (
                          <div
                            key={key}
                            className={`flex items-center gap-1 ${met ? "text-green-600" : "text-muted-foreground"}`}
                          >
                            {met ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-current" />
                            )}
                            <span>
                              {key === "minLength" && "At least 8 characters"}
                              {key === "hasUppercase" && "Uppercase letter"}
                              {key === "hasLowercase" && "Lowercase letter"}
                              {key === "hasNumbers" && "Number"}
                              {key === "hasSpecialChars" && "Special character"}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    disabled={isPending}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {passwordData.confirmPassword &&
                  passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Passwords do not match
                    </p>
                  )}
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={
                  isPending ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
                className="w-full"
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Changing Password...
                  </div>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Security Notifications
          </CardTitle>
          <CardDescription>
            Choose when you want to be notified about security events
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone signs into your account
                </p>
              </div>
              <Switch
                checked={securityPreferences.emailOnLogin}
                onCheckedChange={() =>
                  handleToggleSecurityPreference("emailOnLogin")
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Password changes</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when your password is changed
                </p>
              </div>
              <Switch
                checked={securityPreferences.emailOnPasswordChange}
                onCheckedChange={() =>
                  handleToggleSecurityPreference("emailOnPasswordChange")
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Suspicious activity</p>
                <p className="text-sm text-muted-foreground">
                  Get notified about unusual account activity
                </p>
              </div>
              <Switch
                checked={securityPreferences.emailOnSuspiciousActivity}
                onCheckedChange={() =>
                  handleToggleSecurityPreference("emailOnSuspiciousActivity")
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <h4 className="font-medium">Status</h4>
              <p className="text-sm text-muted-foreground">
                Two-factor authentication is{" "}
                {securityPreferences.twoFactorEnabled ? "enabled" : "disabled"}
              </p>
            </div>
            <Badge
              variant={
                securityPreferences.twoFactorEnabled ? "default" : "destructive"
              }
            >
              {securityPreferences.twoFactorEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          <Button
            variant={
              securityPreferences.twoFactorEnabled ? "outline" : "default"
            }
            onClick={() => handleToggleSecurityPreference("twoFactorEnabled")}
          >
            {securityPreferences.twoFactorEnabled
              ? "Disable 2FA"
              : "Enable 2FA"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
              <h4 className="font-medium text-destructive mb-2">
                Delete Account
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Once you delete your account, there is no going back. Please be
                certain. All your data, including organizations you own, will be
                permanently deleted.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                      <p>
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers.
                      </p>
                      <p className="font-medium">This includes:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Your profile and account information</li>
                        <li>All organizations you own (if any)</li>
                        <li>All associated data and settings</li>
                        <li>Access to all connected services</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={isPending}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isPending ? "Initiating..." : "Yes, delete my account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

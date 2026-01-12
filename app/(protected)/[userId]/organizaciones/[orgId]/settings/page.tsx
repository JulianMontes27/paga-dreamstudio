import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, Bell, Shield, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getFullOrganizationWithPayments,
  listInvitations,
} from "@/server/organizations";
import { getCurrentUser } from "@/server/users";
import { redirect, notFound } from "next/navigation";
import PaymentSettings from "@/components/payment-settings";
import { getTranslations } from "next-intl/server";

export default async function OrganizationSettings({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const t = await getTranslations("settings");

  // Use cached version with payment accounts (slug-based)
  const { user } = await getCurrentUser();
  const org = await getFullOrganizationWithPayments({ organizationSlug: slug });

  if (!org) {
    notFound();
  }

  // Find current user's role in this organization (slug-based)
  const currentUserMember = org.members.find(
    (member) => member.userId === user.id
  );

  if (!currentUserMember) {
    redirect("/dashboard");
  }

  const userRole = currentUserMember.role;

  // Check if user has permission to view settings (only owners and admins)
  if (userRole !== "owner" && userRole !== "admin") {
    redirect(`/dashboard/${slug}/tables`);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <div className="grid gap-5">
        {/* General Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings className="h-4 w-4" />
              {t("generalSettings")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("basicInfo")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("restaurantName")}
                </label>
                <p className="text-sm font-medium mt-1">
                  {org?.name || slug.replace(/-/g, " ")}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("urlSlug")}
                </label>
                <p className="text-sm font-medium mt-1">{slug}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              {t("editInfo")}
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              {t("notifications")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("configureNotifications")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">
                    {t("orderNotifications")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("getNotifiedOrders")}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {t("configure")}
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{t("emailReports")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("dailyWeeklyReports")}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {t("configure")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              {t("security")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("securitySettings")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{t("twoFactor")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("extraSecurity")}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {t("setup")}
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{t("apiAccess")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("manageApiKeys")}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {t("manage")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <PaymentSettings org={org} />

        {/* Billing */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              {t("billing")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("manageBilling")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{t("currentPlan")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("freePlan")}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {t("upgrade")}
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{t("paymentMethod")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("noPaymentMethod")}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  {t("addPayment")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

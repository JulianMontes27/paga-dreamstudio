import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const t = await getTranslations('inventory');
  const tCommon = await getTranslations('common');

  // Use cached organization data from layout
  const { user } = await getCurrentUser();
  const org = await getOrganizationBySlug(slug);

  if (!org) {
    notFound();
  }

  // Check user's role in this organization (slug-based)
  const currentUserMember = org.members.find(
    (member) => member.userId === user.id
  );

  if (!currentUserMember) {
    redirect("/dashboard");
  }

  const userRole = currentUserMember.role;

  // Only admins and owners can view inventory page
  if (userRole === "member") {
    redirect(`/dashboard/${slug}/tables`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('title')}
          </h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            {t('reports')}
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('addItem')}
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('searchItems')} className="pl-10" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {tCommon('filter')}
          </Button>
          <Button variant="outline">
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t('lowStock')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Inventory Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalItems')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t('inventoryItems')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('lowStock')}</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                {t('needRestock')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('inStock')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">{t('itemsAvailable')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalValue')}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">{t('inventoryWorth')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('inventoryAlerts')}
            </CardTitle>
            <CardDescription>
              {t('itemsNeedAttention')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noAlerts')}</p>
              <p className="text-sm">
                {t('alertsWillAppear')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('inventoryItems')}</CardTitle>
                <CardDescription>
                  {t('allIngredients')}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Package className="mr-2 h-4 w-4" />
                {t('bulkActions')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noItems')}</p>
              <p className="text-sm">
                {t('addFirstItem')}
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                {t('addInventoryItem')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('usageTrends')}</CardTitle>
              <CardDescription>{t('mostConsumed')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noUsageData')}</p>
                <p className="text-sm">
                  {t('usageDataWillAppear')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('supplierOverview')}</CardTitle>
              <CardDescription>{t('yourSuppliers')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noSuppliers')}</p>
                <p className="text-sm">
                  {t('addSuppliers')}
                </p>
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('addSupplier')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recentActivity')}</CardTitle>
            <CardDescription>
              {t('latestMovements')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noRecentActivity')}</p>
              <p className="text-sm">{t('movementsWillShow')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

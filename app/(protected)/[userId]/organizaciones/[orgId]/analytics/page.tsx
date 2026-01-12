import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart3,
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Download,
  Filter,
  PieChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getOrganizationBySlug } from "@/server/organizations";
import { getCurrentUser } from "@/server/users";
import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const slug = (await params).slug;
  const t = await getTranslations('analytics');
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

  // Only admins and owners can view analytics page
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
            <Filter className="mr-2 h-4 w-4" />
            {tCommon('filter')}
          </Button>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {t('dateRange')}
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('export')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('totalRevenue')}
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +0% {t('vsLastMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('orderVolume')}
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +0% {t('vsLastMonth')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('customerGrowth')}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +0 {t('newCustomers')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('conversionRate')}
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                +0% {t('improvement')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('revenueTrends')}</CardTitle>
              <CardDescription>{t('monthlyRevenue')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>{t('noRevenueData')}</p>
                <p className="text-sm">
                  {t('revenueChartsWillAppear')}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('customerBehavior')}</CardTitle>
              <CardDescription>{t('orderPatterns')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>{t('noCustomerData')}</p>
                <p className="text-sm">{t('customerInsights')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('peakHours')}</CardTitle>
              <CardDescription>{t('busiestTimes')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noPeakHourData')}</p>
                <p className="text-sm">{t('dataWillShow')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('menuPerformance')}</CardTitle>
              <CardDescription>{t('bestWorstItems')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noMenuAnalytics')}</p>
                <p className="text-sm">{t('itemPerformance')}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('staffEfficiency')}</CardTitle>
              <CardDescription>{t('teamMetrics')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noEfficiencyData')}</p>
                <p className="text-sm">{t('staffMetrics')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('detailedReports')}
            </CardTitle>
            <CardDescription>
              {t('comprehensiveReports')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-medium">{t('financialReport')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('revenueCostsAnalysis')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  {t('generateReport')}
                </Button>
              </div>

              <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-medium">{t('customerAnalysis')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('behaviorRetention')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  {t('generateReport')}
                </Button>
              </div>

              <div className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                  <div>
                    <h3 className="font-medium">{t('operationsReport')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('efficiencyMetrics')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-2">
                  {t('generateReport')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

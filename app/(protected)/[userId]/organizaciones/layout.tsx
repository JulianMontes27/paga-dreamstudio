import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";
import { DashboardFooter } from "@/components/dashboard-footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="dashboard-theme"
    >
      <div className="min-h-screen flex flex-col">
        {/* Dashboard Header */}
        <Header />
        <div className="flex-1 flex flex-col p-4">
          <main className="flex-1">{children}</main>
        </div>
        <DashboardFooter />
      </div>
    </ThemeProvider>
  );
}

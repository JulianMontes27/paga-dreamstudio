import { ThemeProvider } from "@/components/theme-provider";

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
      <div className="flex flex-col">
        <div className="flex-1 flex flex-col p-4">
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}

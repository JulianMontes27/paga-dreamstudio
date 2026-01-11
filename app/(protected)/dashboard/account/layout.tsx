import TabLink from "@/components/account/tab-link";

const tabs = [
  { name: "Overview", href: "/dashboard/account" },
  { name: "Activity", href: "/dashboard/account/activity" },
  { name: "Settings", href: "/dashboard/account/settings" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            return <TabLink tab={tab} key={tab.name} />;
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>{children}</div>
    </div>
  );
}

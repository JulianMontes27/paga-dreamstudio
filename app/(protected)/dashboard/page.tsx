import Link from "next/link";
import { getOrganizations } from "@/server/organizations";

// "/dashboard" route -> Summary of the User's organizations
export default async function Dashboard() {
  const organizations = await getOrganizations();

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        You have {organizations?.length || 0} organization(s)
      </p>

      {organizations && organizations.length > 0 ? (
        <div className="grid gap-4">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/dashboard/${org.slug}/tables`}
              className="p-4 border rounded-lg hover:bg-accent transition-colors"
            >
              <h3 className="font-semibold">{org.name}</h3>
              <p className="text-sm text-muted-foreground">{org.slug}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p>No organizations found. Create one to get started!</p>
      )}
    </div>
  );
}

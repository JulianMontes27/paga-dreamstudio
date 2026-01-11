import React from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { redirect } from "next/navigation";

const ActivityPage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    return redirect("/");
  }

  // Mock activity data - in a real app, this would come from your database
  const activities = [
    {
      id: 1,
      type: "login",
      description: "Signed in to your account",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      ip: "192.168.1.1",
    },
    {
      id: 2,
      type: "email_verified",
      description: "Email address verified",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      ip: "192.168.1.1",
    },
    {
      id: 3,
      type: "account_created",
      description: "Account created",
      timestamp: new Date(session.user.createdAt),
      ip: "192.168.1.1",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Account Activity
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            A log of recent actions on your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b border-border pb-4 last:border-b-0"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>{activity.timestamp.toLocaleDateString()}</span>
                    <span>{activity.timestamp.toLocaleTimeString()}</span>
                    <span>IP: {activity.ip}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === "login"
                        ? "bg-blue-500"
                        : activity.type === "email_verified"
                          ? "bg-green-500"
                          : "bg-gray-500"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security Summary</CardTitle>
          <CardDescription>Overview of your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Two-factor authentication</span>
            <span className="text-sm text-muted-foreground">Not enabled</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Active sessions</span>
            <span className="text-sm text-green-600">1 session</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Last password change</span>
            <span className="text-sm text-muted-foreground">Never</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityPage;

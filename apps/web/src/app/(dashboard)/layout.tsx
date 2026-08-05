export const runtime = 'edge';

import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="app-container">
      <Sidebar user={{ name: user.name, email: user.email, role: user.role }} />
      <main className="main-content">{children}</main>
    </div>
  );
}

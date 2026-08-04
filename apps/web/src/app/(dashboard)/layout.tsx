import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">WA</div>
          <div>
            <div className="sidebar-title">Fastex CRM</div>
            <div style={{ fontSize: "11px", color: "var(--accent-green)", fontWeight: 600 }}>
              WhatsApp Web Suite
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/" className="nav-item">
            <span>📊</span>
            <span>CRM Dashboard</span>
          </Link>

          <Link href="/leads/new" className="nav-item">
            <span>➕</span>
            <span>New Lead Submission</span>
          </Link>

          <Link href="/leads" className="nav-item">
            <span>👥</span>
            <span>Leads & Contacts</span>
          </Link>

          <Link href="/whatsapp/logs" className="nav-item">
            <span>📜</span>
            <span>Message Logs</span>
          </Link>

          {isAdmin && (
            <>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  margin: "16px 12px 6px 12px",
                }}
              >
                Administrator
              </div>
              <Link href="/whatsapp/connection" className="nav-item">
                <span>🔗</span>
                <span>WhatsApp Connection</span>
              </Link>
              <Link href="/whatsapp/settings" className="nav-item">
                <span>⚙️</span>
                <span>Message Settings</span>
              </Link>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div
            style={{
              padding: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              borderRadius: "8px",
              fontSize: "13px",
            }}
          >
            <div style={{ fontWeight: 600, color: "#fff" }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
              {user.email} • <span style={{ color: "var(--accent-cyan)" }}>{user.role}</span>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: "100%", justifyContent: "center", fontSize: "13px" }}
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">{children}</main>
    </div>
  );
}

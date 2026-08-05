"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarUser {
  name: string;
  email: string;
  role: "ADMIN" | "SALESPERSON";
}

interface NavLink {
  href: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
  { href: "/", icon: "📊", label: "CRM Dashboard" },
  { href: "/leads/new", icon: "➕", label: "New Lead Submission" },
  { href: "/leads", icon: "👥", label: "Leads & Contacts" },
  { href: "/whatsapp/logs", icon: "📜", label: "Message History", adminOnly: true },
  { href: "/users", icon: "🛡️", label: "User Management", adminOnly: true },
];

export default function Sidebar({ user }: { user: SidebarUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const links = NAV_LINKS.filter((l) => !l.adminOnly || isAdmin);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className="hamburger-btn"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
        >
          ☰
        </button>
        <div className="mobile-topbar-brand">
          <div className="sidebar-logo-icon" style={{ width: 30, height: 30, fontSize: 14 }}>
            WA
          </div>
          <span>Fastex CRM</span>
        </div>
        <div style={{ width: 42 }} />
      </div>

      {/* Overlay (mobile only, when open) */}
      <div
        className={`sidebar-overlay ${open ? "show" : ""}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "open" : ""}`}>
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
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-item ${isActive(link.href) ? "active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
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
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", wordBreak: "break-all" }}>
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
    </>
  );
}

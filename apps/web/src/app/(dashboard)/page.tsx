export const runtime = 'edge';

import React from "react";
import Link from "next/link";
import { getPrisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardHomePage() {
  const prisma = getPrisma();
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const totalLeads = await prisma.lead.count({
    where: !isAdmin ? { salespersonId: user?.id } : undefined,
  });

  const totalMessages = await prisma.whatsAppMessage.count({
    where: !isAdmin ? { lead: { salespersonId: user?.id } } : undefined,
  });

  const sentMessages = await prisma.whatsAppMessage.count({
    where: !isAdmin
      ? { lead: { salespersonId: user?.id }, status: { in: ["SENT", "DELIVERED", "READ", "ACKNOWLEDGED"] } }
      : { status: { in: ["SENT", "DELIVERED", "READ", "ACKNOWLEDGED"] } },
  });

  const failedMessages = await prisma.whatsAppMessage.count({
    where: !isAdmin ? { lead: { salespersonId: user?.id }, status: "FAILED" } : { status: "FAILED" },
  });

  const session = await prisma.whatsAppSession.findUnique({
    where: { sessionName: "main-business-whatsapp" },
  });

  const recentLeads = await prisma.lead.findMany({
    where: !isAdmin ? { salespersonId: user?.id } : undefined,
    include: {
      salesperson: { select: { name: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.name}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            WhatsApp Web QR-Scanner & Lead Communication Portal
          </p>
        </div>

        <Link href="/leads/new" className="btn btn-primary">
          <span>➕</span>
          <span>Add New Lead</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid-3" style={{ marginBottom: "32px" }}>
        <div className="glass-card">
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
            Total CRM Leads
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "#fff" }}>{totalLeads}</div>
          <div style={{ fontSize: "13px", color: "var(--accent-cyan)", marginTop: "4px" }}>
            {isAdmin ? "Across all salespersons" : "Your assigned leads"}
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
            Successful WhatsApp Sends
          </div>
          <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--accent-green)" }}>{sentMessages}</div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Out of {totalMessages} queued jobs
          </div>
        </div>

        <div className="glass-card">
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
            WhatsApp Web Status
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <span className={`status-badge status-${session?.connectionStatus || "NOT_CONNECTED"}`}>
              <span className="status-dot"></span>
              <span>{session?.connectionStatus || "NOT_CONNECTED"}</span>
            </span>
          </div>
          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px" }}>
            Number: {session?.phoneNumber || "Not linked"}
          </div>
        </div>
      </div>

      {/* Quick navigation and recent leads */}
      <div style={{ marginBottom: "32px" }}>
        <h2>Recent Leads</h2>
        <div className="table-container" style={{ marginTop: "16px" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Mobile Number</th>
                <th>Salesperson</th>
                <th>Consent</th>
                <th>Last Message Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                    No leads recorded yet. Click "Add New Lead" to begin.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead: any) => {
                  const lastMsg = lead.messages[0];
                  return (
                    <tr key={lead.id}>
                      <td style={{ fontWeight: 600 }}>{lead.customerName}</td>
                      <td>{lead.normalizedNumber}</td>
                      <td>{lead.salesperson?.name}</td>
                      <td>
                        {lead.consentProvided ? (
                          <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>✓ Granted</span>
                        ) : (
                          <span style={{ color: "var(--accent-red)" }}>No Consent</span>
                        )}
                      </td>
                      <td>
                        {lastMsg ? (
                          <span className={`status-badge status-${lastMsg.status}`}>
                            {lastMsg.status}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>No Message</span>
                        )}
                      </td>
                      <td>{new Date(lead.createdAt).toLocaleDateString("en-IN")}</td>
                      <td>
                        <Link
                          href={`/leads/${lead.id}`}
                          style={{
                            color: "var(--accent-cyan)",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          View CRM →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

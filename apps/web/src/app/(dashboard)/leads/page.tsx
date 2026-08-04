"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getMonsoonEditMessage, getWhatsAppClickToChatUrl } from "@fastex/shared";

export default function LeadsListPage() {

  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLeads = async (searchQuery = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Could not load leads:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads(search);
  };

  const handleExportCSV = () => {

    if (leads.length === 0) return;
    const headers = [
      "Customer Name",
      "Mobile Number",
      "Company",
      "Category",
      "Lead Status",
      "Salesperson",
      "Created Date",
      "Note",
    ];
    const rows = leads.map((l) => [
      `"${l.customerName || ""}"`,
      `"${l.normalizedNumber || ""}"`,
      `"${l.businessName || ""}"`,
      `"${l.businessCategory || ""}"`,
      `"${l.leadStatus || "HOT LEAD"}"`,
      `"${l.salesperson?.name || ""}"`,
      `"${new Date(l.createdAt).toLocaleDateString("en-IN")}"`,
      `"${(l.note || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fastex_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadStatus: newStatus }),
      });
      fetchLeads(search);
    } catch (e) {}
  };

  const handleDeleteLead = async (leadId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete lead "${name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      fetchLeads(search);
    } catch (e) {}
  };

  return (
    <div>
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Leads & Contacts CRM</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            View and manage customer leads, check consent records, and review WhatsApp message history
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ borderColor: "var(--accent-green)", color: "var(--accent-green)" }}
          >
            <span>📥</span>
            <span>Export to CSV</span>
          </button>
          <Link href="/leads/new" className="btn btn-primary">
            <span>➕</span>
            <span>Add New Lead</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ marginBottom: "24px", padding: "16px" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by customer name, mobile number, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
            Search CRM
          </button>
        </form>
      </div>


      {/* Leads Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Mobile Number</th>
              <th>Company</th>
              <th>Category</th>
              <th>Lead Status</th>
              <th>Salesperson</th>
              <th>Submitted Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No customer leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                return (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 600 }}>{lead.customerName}</td>
                    <td>{lead.normalizedNumber}</td>
                    <td>{lead.businessName || "—"}</td>
                    <td>{lead.businessCategory || "—"}</td>
                    <td>
                      <select
                        value={lead.leadStatus || "HOT LEAD"}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          color: "#fff",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        <option value="HOT LEAD">🔥 HOT LEAD</option>
                        <option value="WARM LEAD">☀️ WARM LEAD</option>
                        <option value="COLD LEAD">❄️ COLD LEAD</option>
                        <option value="CONVERTED">🏆 CONVERTED</option>
                        <option value="NOT INTERESTED">❌ NOT INTERESTED</option>
                      </select>
                    </td>
                    <td>{lead.salesperson?.name}</td>
                    <td>{new Date(lead.createdAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981", borderColor: "#059669" }}
                        onClick={async () => {
                          const flyerUrl = window.location.origin + "/monsoon-edit-flyer.jpg";
                          const text = getMonsoonEditMessage(lead.customerName, flyerUrl);
                          const waUrl = getWhatsAppClickToChatUrl(lead.normalizedNumber, text);
                          window.open(waUrl, "_blank");
                          try {
                            await fetch(`/api/leads/${lead.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ markContacted: true, messageContent: text }),
                            });
                            fetchLeads(search);
                          } catch (e) {}
                        }}
                      >
                        💬 WA Chat & Mark Sent
                      </button>
                      <Link
                        href={`/leads/${lead.id}`}
                        style={{ color: "var(--accent-cyan)", fontWeight: 600, fontSize: "13px" }}
                      >
                        Details →
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: "6px 10px", fontSize: "12px" }}
                        onClick={() => handleDeleteLead(lead.id, lead.customerName)}
                        title="Delete Lead"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


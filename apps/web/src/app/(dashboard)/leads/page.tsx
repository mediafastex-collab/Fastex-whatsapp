"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getMonsoonEditMessage } from "@fastex/shared";

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

  return (
    <div>
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Leads & Contacts CRM</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            View and manage customer leads, check consent records, and review WhatsApp message history
          </p>
        </div>

        <Link href="/leads/new" className="btn btn-primary">
          <span>➕</span>
          <span>Add New Lead</span>
        </Link>
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
              <th>Salesperson</th>
              <th>Consent</th>
              <th>WhatsApp Reg.</th>
              <th>Latest Message</th>
              <th>Submitted Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  Loading leads...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No customer leads found.
                </td>
              </tr>
            ) : (
              leads.map((lead) => {
                const latestMsg = lead.messages && lead.messages[0];
                return (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 600 }}>{lead.customerName}</td>
                    <td>{lead.normalizedNumber}</td>
                    <td>{lead.businessName || "—"}</td>
                    <td>{lead.salesperson?.name}</td>
                    <td>
                      {lead.consentProvided ? (
                        <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>✓ Granted</span>
                      ) : (
                        <span style={{ color: "var(--accent-red)" }}>No Consent</span>
                      )}
                    </td>
                    <td>
                      {lead.isRegisteredOnWa === true ? (
                        <span style={{ color: "var(--accent-green)" }}>Registered</span>
                      ) : lead.isRegisteredOnWa === false ? (
                        <span style={{ color: "var(--accent-red)" }}>Unregistered</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>Unchecked</span>
                      )}
                    </td>
                    <td>
                      {latestMsg ? (
                        <span className={`status-badge status-${latestMsg.status}`}>
                          {latestMsg.status}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>None</span>
                      )}
                    </td>
                    <td>{new Date(lead.createdAt).toLocaleDateString("en-IN")}</td>
                    <td style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: "6px 12px", fontSize: "12px", background: "#10b981", borderColor: "#059669" }}
                        onClick={async () => {
                          const flyerUrl = window.location.origin + "/monsoon-edit-flyer.jpg";
                          const text = getMonsoonEditMessage(lead.customerName, flyerUrl);
                          const waUrl = `https://wa.me/${lead.normalizedNumber.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
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

"use client";

export const runtime = 'edge';

import React, { useEffect, useState } from "react";
import Link from "next/link";

export default function MessageLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    customerName: "",
    mobileNumber: "",
    salespersonId: "",
    status: "",
    messageType: "",
    leadId: "",
    startDate: "",
    endDate: "",
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.customerName) query.set("customerName", filters.customerName);
      if (filters.mobileNumber) query.set("mobileNumber", filters.mobileNumber);
      if (filters.salespersonId) query.set("salespersonId", filters.salespersonId);
      if (filters.status) query.set("status", filters.status);
      if (filters.messageType) query.set("messageType", filters.messageType);
      if (filters.leadId) query.set("leadId", filters.leadId);
      if (filters.startDate) query.set("startDate", filters.startDate);
      if (filters.endDate) query.set("endDate", filters.endDate);

      const res = await fetch(`/api/logs?${query.toString()}`);
      if (res.ok) {
        const data: any = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Error loading logs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const clearFilters = () => {
    setFilters({
      customerName: "",
      mobileNumber: "",
      salespersonId: "",
      status: "",
      messageType: "",
      leadId: "",
      startDate: "",
      endDate: "",
    });
    setTimeout(() => fetchLogs(), 100);
  };

  return (
    <div>
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>WhatsApp Message Logs</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Real-time delivery & acknowledgement tracking across all lead communications
          </p>
        </div>

        <button type="button" className="btn btn-secondary" onClick={fetchLogs}>
          <span>🔄</span>
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ marginBottom: "28px" }}>
        <form onSubmit={handleFilterSubmit}>
          <div className="grid-3" style={{ gap: "16px", marginBottom: "16px" }}>
            <div>
              <label className="form-label" style={{ fontSize: "12px" }}>Customer Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search customer..."
                value={filters.customerName}
                onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "12px" }}>Mobile Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 / 9876..."
                value={filters.mobileNumber}
                onChange={(e) => setFilters({ ...filters, mobileNumber: e.target.value })}
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "12px" }}>Message Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="QUEUED">QUEUED</option>
                <option value="SENT">SENT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="READ">READ</option>
                <option value="FAILED">FAILED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "12px" }}>Automatic / Manual</label>
              <select
                className="form-select"
                value={filters.messageType}
                onChange={(e) => setFilters({ ...filters, messageType: e.target.value })}
              >
                <option value="">All Types</option>
                <option value="AUTOMATIC">Automatic Welcome</option>
                <option value="MANUAL">Manual / Retry / Custom</option>
              </select>
            </div>

            <div>
              <label className="form-label" style={{ fontSize: "12px" }}>Lead ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="UUID filter..."
                value={filters.leadId}
                onChange={(e) => setFilters({ ...filters, leadId: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: "12px" }}>
                Apply Filters
              </button>
              <button type="button" className="btn btn-secondary" onClick={clearFilters} style={{ padding: "12px" }}>
                Clear
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Recipient</th>
              <th>Customer / Lead</th>
              <th>Type</th>
              <th>Message Content</th>
              <th>Attempts</th>
              <th>Timestamps</th>
              <th>Error Info</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  Loading message logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No message logs match your filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className={`status-badge status-${log.status}`}>
                      <span className="status-dot"></span>
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{log.recipientNumber}</td>
                  <td>
                    {log.lead ? (
                      <Link
                        href={`/leads/${log.lead.id}`}
                        style={{ color: "var(--accent-cyan)", fontWeight: 600 }}
                      >
                        {log.lead.customerName} →
                      </Link>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>Unattached</span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.05)",
                      }}
                    >
                      {log.messageType}
                    </span>
                  </td>
                  <td style={{ maxWidth: "260px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {log.messageContent}
                  </td>
                  <td style={{ textAlign: "center" }}>{log.attemptCount}</td>
                  <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    <div>Q: {new Date(log.queuedAt || log.createdAt).toLocaleTimeString("en-IN")}</div>
                    {log.sentAt && <div style={{ color: "var(--accent-green)" }}>S: {new Date(log.sentAt).toLocaleTimeString("en-IN")}</div>}
                    {log.deliveredAt && <div style={{ color: "var(--accent-cyan)" }}>D: {new Date(log.deliveredAt).toLocaleTimeString("en-IN")}</div>}
                    {log.readAt && <div style={{ color: "var(--accent-violet)" }}>R: {new Date(log.readAt).toLocaleTimeString("en-IN")}</div>}
                  </td>
                  <td>
                    {log.errorMessage ? (
                      <span style={{ color: "#f87171", fontSize: "12px" }}>
                        [{log.errorCode}] {log.errorMessage}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>None</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

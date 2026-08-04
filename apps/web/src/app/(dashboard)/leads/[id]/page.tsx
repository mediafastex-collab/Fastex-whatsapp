"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getMonsoonEditMessage } from "@fastex/shared";

export default function LeadDetailPage() {

  const params = useParams();
  const leadId = params.id as string;

  const [lead, setLead] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showConfirmResend, setShowConfirmResend] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customText, setCustomText] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchLead = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (res.ok) {
        const data = await res.json();
        setLead(data);
      } else {
        const err = await res.json();
        setMessage(`Error: ${err.error || "Failed to load lead"}`);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchLead();
  }, [leadId]);

  const handleAction = async (action: string, customMsgText?: string) => {
    setActionLoading(true);
    setMessage("");
    setShowConfirmResend(false);
    setShowCustomModal(false);

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          customMessage: customMsgText,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setMessage(`Success! Message queued for sending (Job ID: ${data.jobId || data.messageId || "ok"}).`);
      if (action === "send-custom") setCustomText("");
      await fetchLead();
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const copyNumber = () => {
    if (lead?.normalizedNumber) {
      navigator.clipboard.writeText(lead.normalizedNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMonsoonEditWhatsApp = async () => {
    if (!lead?.normalizedNumber) return;
    const flyerUrl = window.location.origin + "/monsoon-edit-flyer.jpg";
    const text = getMonsoonEditMessage(lead.customerName, flyerUrl);
    const waUrl = `https://wa.me/${lead.normalizedNumber.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;

    window.open(waUrl, "_blank");

    try {
      await fetch(`/api/leads/${leadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markContacted: true,
          messageContent: text,
        }),
      });
      setMessage("✨ WhatsApp Click-to-Chat opened with Monsoon Edit 2026 message & Lead recorded as CONTACTED!");
      await fetchLead();
    } catch (err: any) {
      setMessage(`Error recording status: ${err.message}`);
    }
  };


  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "64px", color: "var(--text-secondary)" }}>
        Loading lead CRM details...
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ textAlign: "center", padding: "64px" }}>
        <h2>Lead not found</h2>
        <Link href="/leads" className="btn btn-secondary" style={{ marginTop: "16px" }}>
          ← Return to Leads
        </Link>
      </div>
    );
  }

  const hasFailedMsg = lead.messages && lead.messages.some((m: any) => m.status === "FAILED");

  return (
    <div>
      <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Link href="/leads" style={{ fontSize: "13px", color: "var(--accent-cyan)", marginBottom: "8px", display: "inline-block" }}>
            ← Back to Leads Table
          </Link>
          <h1>{lead.customerName}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            {lead.businessName ? `${lead.businessName} • ` : ""}
            {lead.businessCategory || "Lead"} • Assigned to <strong>{lead.salesperson?.name}</strong>
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {/* 1. Copy WhatsApp number */}
          <button type="button" className="btn btn-secondary" onClick={copyNumber}>
            <span>📋</span>
            <span>{copied ? "Number Copied!" : "Copy Number"}</span>
          </button>

          {/* 2. Monsoon Edit 2026 Click-to-Chat & Mark Sent */}
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: "#10b981", borderColor: "#059669" }}
            onClick={handleMonsoonEditWhatsApp}
          >
            <span>💬</span>
            <span>Monsoon Edit WhatsApp & Mark Sent</span>
          </button>

          {/* 2b. View/Download Flyer */}
          <a
            href="/monsoon-edit-flyer.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ borderColor: "var(--accent-cyan)", color: "var(--accent-cyan)" }}
          >
            <span>📄</span>
            <span>View Flyer</span>
          </a>

          {/* 3. Send welcome message */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleAction("send-welcome")}
            disabled={actionLoading}
          >
            <span>✨</span>
            <span>Send Welcome Message</span>
          </button>

          {/* 4. Resend a failed message (with confirmation) */}
          {hasFailedMsg && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowConfirmResend(true)}
              disabled={actionLoading}
            >
              <span>🔄</span>
              <span>Resend Failed Message</span>
            </button>
          )}

          {/* 5. Send manually written message */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowCustomModal(true)}
            disabled={actionLoading}
          >
            <span>✍️</span>
            <span>Send Custom Message</span>
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            background: message.startsWith("Error") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: "1px solid " + (message.startsWith("Error") ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"),
            borderRadius: "8px",
            color: message.startsWith("Error") ? "#f87171" : "#34d399",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          {message}
        </div>
      )}

      <div className="grid-2">
        {/* Lead Info Box */}
        <div className="glass-card">
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Lead Information & Consent</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Mobile Number</span>
              <span style={{ fontWeight: 600 }}>{lead.normalizedNumber}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>WhatsApp Recipient ID</span>
              <span style={{ fontFamily: "monospace", fontSize: "13px", color: "var(--accent-cyan)" }}>{lead.recipientId}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>WhatsApp Registration Status</span>
              <span>
                {lead.isRegisteredOnWa === true ? (
                  <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>✓ Registered</span>
                ) : lead.isRegisteredOnWa === false ? (
                  <span style={{ color: "var(--accent-red)" }}>✗ Unregistered</span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>Not verified yet</span>
                )}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Consent Status</span>
              <span>
                {lead.consentProvided ? (
                  <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>✓ Granted</span>
                ) : (
                  <span style={{ color: "var(--accent-red)" }}>Not Provided</span>
                )}
              </span>
            </div>

            {lead.consentProvided && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(16, 185, 129, 0.08)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                }}
              >
                <div><strong>Consent Timestamp:</strong> {new Date(lead.consentTimestamp || lead.createdAt).toLocaleString("en-IN")}</div>
                <div style={{ marginTop: "4px" }}><strong>Text:</strong> “{lead.consentText}”</div>
              </div>
            )}

            {lead.note && (
              <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "13px", display: "block", marginBottom: "4px" }}>
                  Meeting Notes
                </span>
                <p style={{ fontSize: "14px", color: "#fff", lineHeight: "1.5" }}>{lead.note}</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Attempts Timeline */}
        <div className="glass-card">
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>WhatsApp Message History ({lead.messages?.length || 0})</h2>

          {!lead.messages || lead.messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "14px" }}>
              No WhatsApp messages sent to this lead yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {lead.messages.map((msg: any) => (
                <div
                  key={msg.id}
                  style={{
                    padding: "14px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "rgba(255,255,255,0.08)",
                        fontWeight: 600,
                      }}
                    >
                      {msg.messageType}
                    </span>
                    <span className={`status-badge status-${msg.status}`}>
                      <span className="status-dot"></span>
                      <span>{msg.status}</span>
                    </span>
                  </div>

                  <p style={{ fontSize: "14px", color: "#fff", marginBottom: "8px", lineHeight: "1.4" }}>
                    {msg.messageContent}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)" }}>
                    <span>Attempts: {msg.attemptCount}</span>
                    <span>{new Date(msg.createdAt).toLocaleString("en-IN")}</span>
                  </div>

                  {msg.errorMessage && (
                    <div
                      style={{
                        marginTop: "8px",
                        padding: "8px 10px",
                        background: "rgba(239, 68, 68, 0.1)",
                        borderRadius: "6px",
                        color: "#f87171",
                        fontSize: "12px",
                      }}
                    >
                      <strong>Error ({msg.errorCode}):</strong> {msg.errorMessage}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Resending Failed Message */}
      {showConfirmResend && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: "20px", color: "var(--accent-yellow)", marginBottom: "12px" }}>
              Confirm Resend Failed Message
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Are you sure you want to resend the last failed WhatsApp message to{" "}
              <strong>{lead.customerName}</strong> ({lead.normalizedNumber})? This attempt will respect configured rate limits and consent rules.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmResend(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleAction("resend-failed")}
              >
                Yes, Resend Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Custom Manual Message */}
      {showCustomModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>Send Custom WhatsApp Message</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "16px" }}>
              Compose a custom text message to be sent to <strong>{lead.customerName}</strong> via the WhatsApp worker queue.
            </p>

            <div className="form-group">
              <label className="form-label">Message Text</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Hello Aarav, here is the follow-up brochure we discussed..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCustomModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!customText.trim() || actionLoading}
                onClick={() => handleAction("send-custom", customText)}
              >
                Send via Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

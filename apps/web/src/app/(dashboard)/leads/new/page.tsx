"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { normalizeMobileNumber } from "@fastex/shared";

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "",
    originalNumber: "+91 ",
    businessName: "",
    businessCategory: "",
    note: "",
    followUpDate: "",
    consentProvided: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [normalizedPreview, setNormalizedPreview] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const handleNumberChange = (val: string) => {
    setForm({ ...form, originalNumber: val });
    const norm = normalizeMobileNumber(val, "+91");
    setNormalizedPreview(norm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit lead");
      }

      setSuccessMsg(
        `Lead "${data.lead.customerName}" saved successfully!` +
          (data.messageQueued
            ? " Automatic welcome WhatsApp message has been queued."
            : " (No automatic message sent: consent or settings check)")
      );

      setTimeout(() => {
        router.push(`/leads/${data.lead.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1>Submit New Customer Lead</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Capture customer details, record WhatsApp consent, and trigger automated welcome communication
        </p>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "8px",
            color: "#f87171",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          {error}
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: "16px",
            background: "rgba(16, 185, 129, 0.15)",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            borderRadius: "8px",
            color: "#34d399",
            fontSize: "14px",
            marginBottom: "24px",
            fontWeight: 600,
          }}
        >
          ✓ {successMsg}
        </div>
      )}

      <div className="glass-panel" style={{ maxWidth: "720px", padding: "32px" }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="e.g. Aarav Sharma"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number * (India +91 default)</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="+91 98765 43210"
                value={form.originalNumber}
                onChange={(e) => handleNumberChange(e.target.value)}
              />
              {normalizedPreview && (
                <div
                  style={{
                    fontSize: "12px",
                    marginTop: "6px",
                    color: normalizedPreview.isValid ? "var(--accent-green)" : "var(--accent-red)",
                  }}
                >
                  {normalizedPreview.isValid
                    ? `✓ WhatsApp ID: ${normalizedPreview.recipientId}`
                    : `✗ ${normalizedPreview.errorMessage || "Invalid mobile number format"}`}
                </div>
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Customer's Business / Company</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Sharma Enterprises"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Category (Open Text or Choose Suggestion)</label>
              <input
                type="text"
                list="business-categories-list"
                className="form-input"
                placeholder="e.g. Event Production, Healthcare, Real Estate... or write anything"
                value={form.businessCategory}
                onChange={(e) => setForm({ ...form, businessCategory: e.target.value })}
              />
              <datalist id="business-categories-list">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Meeting Notes / Requirements</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. Visited Fastex booth, inquired about enterprise WhatsApp QR-scanner workflow..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Next Follow-up Date</label>
            <input
              type="date"
              className="form-input"
              value={form.followUpDate}
              onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
            />
          </div>

          {/* Consent Checkbox */}
          <div
            style={{
              padding: "18px 20px",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              borderRadius: "12px",
              marginBottom: "28px",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={form.consentProvided}
                onChange={(e) => setForm({ ...form, consentProvided: e.target.checked })}
                style={{ width: "20px", height: "20px", marginTop: "2px", accentColor: "var(--accent-green)" }}
              />
              <div>
                <strong style={{ display: "block", color: "#fff", fontSize: "14px" }}>
                  Customer WhatsApp Messaging Consent
                </strong>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  “I agree to receive information and follow-up messages from this business through WhatsApp.”
                </span>
                <span style={{ display: "block", fontSize: "11px", color: "var(--accent-yellow)", marginTop: "4px" }}>
                  Note: Automatic welcome messages will not be sent if consent is not granted.
                </span>
              </div>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push("/")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "14px 32px", fontSize: "15px" }}
              disabled={loading}
            >
              {loading ? "Saving & Enqueuing..." : "Submit & Send Welcome WhatsApp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

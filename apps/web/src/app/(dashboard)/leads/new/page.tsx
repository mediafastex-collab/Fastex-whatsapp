"use client";

export const runtime = 'edge';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { normalizeMobileNumber, getMonsoonEditMessage, getWhatsAppClickToChatUrl } from "@fastex/shared";

export default function NewLeadPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    customerName: "",
    originalNumber: "+91 ",
    businessName: "",
    businessCategory: "",
    leadStatus: "HOT LEAD",
    note: "",
    followUpDate: "",
    consentProvided: true,
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

  const [waUrlState, setWaUrlState] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setWaUrlState("");

    // Open a blank tab synchronously in response to the form submit click so browsers don't block it as a popup!
    const newTab = window.open("about:blank", "_blank");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data: any = await res.json();
      if (!res.ok) {
        if (newTab) newTab.close();
        throw new Error(data.error || "Failed to submit lead");
      }

      // Generate WhatsApp Click-to-Chat URL with proper CRLF line breaks and emoji support
      const flyerUrl = window.location.origin + "/monsoon-edit-flyer.jpg";
      const text = getMonsoonEditMessage(data.lead.customerName, flyerUrl);
      const waUrl = getWhatsAppClickToChatUrl(data.lead.normalizedNumber, text);
      setWaUrlState(waUrl);

      // Navigate the opened tab to WhatsApp
      if (newTab) {
        newTab.location.href = waUrl;
      } else {
        // Fallback programmatic link click
        const link = document.createElement("a");
        link.href = waUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      // Mark as contacted in background
      try {
        await fetch(`/api/leads/${data.lead.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markContacted: true, messageContent: text }),
        });
      } catch (e) {}

      setSuccessMsg(`Lead "${data.lead.customerName}" saved & WhatsApp Click-to-Chat opened!`);

      setTimeout(() => {
        router.push("/leads");
      }, 2500);
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
          <div style={{ marginBottom: waUrlState ? "12px" : "0" }}>✓ {successMsg}</div>
          {waUrlState && (
            <a
              href={waUrlState}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                background: "#10b981",
                borderColor: "#059669",
                color: "#fff",
                textDecoration: "none",
                fontSize: "14px",
              }}
            >
              💬 Click Here to Open WhatsApp (If popup was blocked)
            </a>
          )}
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
                {categories.map((cat: string) => (
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

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Next Follow-up Date</label>
              <input
                type="date"
                className="form-input"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Lead Status / Priority</label>
              <select
                className="form-input"
                value={form.leadStatus}
                onChange={(e) => setForm({ ...form, leadStatus: e.target.value })}
                style={{ background: "rgba(255, 255, 255, 0.05)", color: "#fff" }}
              >
                <option value="HOT LEAD">🔥 HOT LEAD</option>
                <option value="WARM LEAD">☀️ WARM LEAD</option>
                <option value="COLD LEAD">❄️ COLD LEAD</option>
                <option value="CONVERTED">🏆 CONVERTED</option>
                <option value="NOT INTERESTED">❌ NOT INTERESTED</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
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
              style={{ padding: "14px 32px", fontSize: "15px", background: "#10b981", borderColor: "#059669" }}
              disabled={loading}
            >
              {loading ? "Saving & Opening WhatsApp..." : "💬 Submit & Open Monsoon Edit WhatsApp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


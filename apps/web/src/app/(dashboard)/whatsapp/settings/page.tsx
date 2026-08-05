"use client";

export const runtime = 'edge';

import React, { useEffect, useState } from "react";
import { renderWhatsAppMessage, getSamplePlaceholders } from "@fastex/shared";

export default function WhatsAppSettingsPage() {
  const [settings, setSettings] = useState<any>({
    activeStatus: true,
    defaultMessage:
      "Hello {{customer_name}}, thank you for visiting {{business_name}}. It was great meeting you. {{salesperson_name}} will contact you shortly.",
    delaySeconds: 0,
    maxPerMinute: 10,
    maxRetryCount: 2,
    minDelayBetweenMs: 4000,
    consentRequired: true,
    businessName: "Fastex Collaborations",
    fallbackMessage: "Hello, thank you for connecting with us.",
    testRecipient: "+91 98765 43210",
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [testNumber, setTestNumber] = useState("+91 98765 43210");
  const [testStatus, setTestStatus] = useState("");
  const [samplePlaceholders] = useState(getSamplePlaceholders());

  useEffect(() => {
    fetch("/api/whatsapp/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings(data);
          if (data.testRecipient) setTestNumber(data.testRecipient);
        }
      })
      .catch((e) => console.warn("Could not load settings:", e));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/whatsapp/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaveMessage("Settings saved successfully!");
    } catch (err: any) {
      setSaveMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testNumber || !testNumber.trim()) {
      setTestStatus("Error: Test mobile number is required");
      return;
    }
    setTestStatus("Sending test message...");
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientNumber: testNumber,
          customMessage: renderWhatsAppMessage(settings.defaultMessage, samplePlaceholders),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send test failed");
      setTestStatus(`Success! Test message queued (Job ID: ${data.messageId || "ok"}).`);
    } catch (err: any) {
      setTestStatus(`Error: ${err.message}`);
    }
  };

  const previewText = renderWhatsAppMessage(settings.defaultMessage || "", samplePlaceholders);

  return (
    <div>
      {/* Admin Warning Banner */}
      <div className="warning-banner">
        <div>⚠️</div>
        <div>
          <strong style={{ display: "block", marginBottom: "4px" }}>
            Unofficial WhatsApp Web Integration Notice
          </strong>
          This application connects through WhatsApp Web rather than the official WhatsApp Cloud API. WhatsApp Web changes, session expiration, phone connectivity, or account restrictions may interrupt messaging. Avoid unsolicited or excessive automated messages.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1>WhatsApp Message Settings</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Configure automatic welcome messaging, rate throttling, and customer consent policies
          </p>
        </div>
      </div>

      {saveMessage && (
        <div
          style={{
            padding: "12px 16px",
            background: saveMessage.startsWith("Error") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: "1px solid " + (saveMessage.startsWith("Error") ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"),
            borderRadius: "8px",
            color: saveMessage.startsWith("Error") ? "#f87171" : "#34d399",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          {saveMessage}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid-2" style={{ marginBottom: "24px" }}>
          {/* Editor Left Column */}
          <div className="glass-card">
            <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Template & Business Identity</h2>

            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                className="form-input"
                value={settings.businessName || ""}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Default Welcome Message Template</label>
              <textarea
                className="form-textarea"
                rows={5}
                value={settings.defaultMessage || ""}
                onChange={(e) => setSettings({ ...settings, defaultMessage: e.target.value })}
                required
              />
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                Supported Placeholders: <code>{"{{customer_name}}"}</code>, <code>{"{{customer_mobile}}"}</code>,{" "}
                <code>{"{{business_name}}"}</code>, <code>{"{{salesperson_name}}"}</code>, <code>{"{{note}}"}</code>,{" "}
                <code>{"{{date}}"}</code>, <code>{"{{follow_up_date}}"}</code>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Fallback Message (if placeholders fail)</label>
              <input
                type="text"
                className="form-input"
                value={settings.fallbackMessage || ""}
                onChange={(e) => setSettings({ ...settings, fallbackMessage: e.target.value })}
              />
            </div>
          </div>

          {/* Right Column: Live Preview & Testing */}
          <div className="glass-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>Live WhatsApp Preview</h2>

              <div
                style={{
                  background: "#0c1317",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  backgroundImage: "linear-gradient(to bottom, #0c1317, #0b141a)",
                  minHeight: "160px",
                  marginBottom: "24px",
                }}
              >
                <div
                  style={{
                    background: "#005c4b",
                    color: "#fff",
                    padding: "12px 14px",
                    borderRadius: "8px 8px 8px 0",
                    fontSize: "14px",
                    lineHeight: "1.5",
                    maxWidth: "85%",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
                  }}
                >
                  {previewText || "Your message preview will appear here..."}
                  <div style={{ textAlign: "right", fontSize: "10px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>
                    10:45 AM ✓✓
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                paddingTop: "20px",
                borderTop: "1px solid var(--border-color)",
              }}
            >
              <h3 style={{ fontSize: "15px", marginBottom: "12px" }}>Test Message Delivery</h3>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  className="form-input"
                  value={testNumber}
                  onChange={(e) => setTestNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSendTest}
                  style={{ whiteSpace: "nowrap" }}
                >
                  Send Test Message
                </button>
              </div>

              {testStatus && (
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "13px",
                    color: testStatus.startsWith("Error") ? "#f87171" : "var(--accent-green)",
                  }}
                >
                  {testStatus}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Throttling & Safety Config Card */}
        <div className="glass-card" style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Safety Throttling & Consent Rules</h2>

          <div className="grid-3">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Maximum Messages / Minute</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="30"
                value={settings.maxPerMinute || 10}
                onChange={(e) => setSettings({ ...settings, maxPerMinute: parseInt(e.target.value, 10) || 10 })}
              />
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Safe limit: 10 msg/min
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Minimum Delay Between Messages (ms)</label>
              <input
                type="number"
                className="form-input"
                min="2000"
                max="15000"
                step="500"
                value={settings.minDelayBetweenMs || 4000}
                onChange={(e) => setSettings({ ...settings, minDelayBetweenMs: parseInt(e.target.value, 10) || 4000 })}
              />
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Default: 4000 ms (4 seconds)
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Automatic Retries on Failure</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max="5"
                value={settings.maxRetryCount || 2}
                onChange={(e) => setSettings({ ...settings, maxRetryCount: parseInt(e.target.value, 10) || 2 })}
              />
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                Maximum 2 automatic retries
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "32px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-color)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={!!settings.activeStatus}
                onChange={(e) => setSettings({ ...settings, activeStatus: e.target.checked })}
                style={{ width: "18px", height: "18px" }}
              />
              <span>Enable Automatic Welcome Messaging on Lead Submission</span>
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px" }}>
              <input
                type="checkbox"
                checked={!!settings.consentRequired}
                onChange={(e) => setSettings({ ...settings, consentRequired: e.target.checked })}
                style={{ width: "18px", height: "18px" }}
              />
              <span>Require Customer Consent Checkbox Before Sending</span>
            </label>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "12px 28px" }} disabled={loading}>
            {loading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}

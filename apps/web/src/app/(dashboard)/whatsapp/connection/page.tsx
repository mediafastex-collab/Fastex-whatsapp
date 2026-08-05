"use client";

export const runtime = 'edge';

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function WhatsAppConnectionPage() {
  const [statusData, setStatusData] = useState<any>({
    connectionStatus: "NOT_CONNECTED",
    qrCode: null,
    authError: null,
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      if (res.ok) {
        const data = await res.json();
        const merged = {
          ...data.dbSession,
          ...data.workerStatus,
        };
        setStatusData(merged);
      }
    } catch (e) {
      console.warn("Error fetching whatsapp status:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    setActionMessage("");
    try {
      const res = await fetch("/api/whatsapp/initialize", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Initialization failed");
      setActionMessage("WhatsApp worker started. Please wait for QR code generation...");
      await fetchStatus();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = async () => {
    setLoading(true);
    setActionMessage("");
    try {
      const res = await fetch("/api/whatsapp/restart", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Restart failed");
      setActionMessage("Worker restarted without clearing LocalAuth session.");
      await fetchStatus();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    setShowConfirmLogout(false);
    setActionMessage("");
    try {
      const res = await fetch("/api/whatsapp/logout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Logout failed");
      setActionMessage("WhatsApp account logged out and session destroyed. Fresh QR scan required.");
      await fetchStatus();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isConnected = statusData.connectionStatus === "CONNECTED";

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
          {!isConnected && (
            <div style={{ marginTop: "6px", color: "#f87171", fontWeight: 600 }}>
              • Automatic WhatsApp messages are currently paused. Leads will continue to be saved and eligible messages will remain queued.
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1>WhatsApp Connection</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Manage the direct WhatsApp Web QR-code mobile authentication session
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRestart}
            disabled={loading}
          >
            <span>🔄</span>
            <span>Restart Connection</span>
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowConfirmLogout(true)}
            disabled={loading}
          >
            <span>🔌</span>
            <span>Disconnect WhatsApp</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            padding: "12px 16px",
            background: actionMessage.startsWith("Error") ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: "1px solid " + (actionMessage.startsWith("Error") ? "rgba(239, 68, 68, 0.4)" : "rgba(16, 185, 129, 0.4)"),
            borderRadius: "8px",
            color: actionMessage.startsWith("Error") ? "#f87171" : "#34d399",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          {actionMessage}
        </div>
      )}

      <div className="grid-2">
        {/* Connection Details Box */}
        <div className="glass-card">
          <h2 style={{ fontSize: "18px", marginBottom: "20px" }}>Session & Worker Status</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Current Connection Status</span>
              <span className={`status-badge status-${statusData.connectionStatus || "NOT_CONNECTED"}`}>
                <span className="status-dot"></span>
                <span>{statusData.connectionStatus || "NOT_CONNECTED"}</span>
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Connected WhatsApp Number</span>
              <span style={{ fontWeight: 600, color: "#fff" }}>{statusData.phoneNumber || "Not linked"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Connected Profile Name</span>
              <span style={{ fontWeight: 600, color: "#fff" }}>{statusData.profileName || "Not linked"}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Last Connected Time</span>
              <span style={{ fontSize: "13px" }}>
                {statusData.lastConnectedAt
                  ? new Date(statusData.lastConnectedAt).toLocaleString("en-IN")
                  : "Never"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Last Disconnected Time</span>
              <span style={{ fontSize: "13px" }}>
                {statusData.lastDisconnectedAt
                  ? new Date(statusData.lastDisconnectedAt).toLocaleString("en-IN")
                  : "None"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Last Successful Message Time</span>
              <span style={{ fontSize: "13px" }}>
                {statusData.lastSuccessfulMsgAt
                  ? new Date(statusData.lastSuccessfulMsgAt).toLocaleString("en-IN")
                  : "Never"}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Worker Instance Status</span>
              <span style={{ fontSize: "13px", color: "var(--accent-cyan)", fontWeight: 600 }}>
                {statusData.workerInstanceId ? `Active (${statusData.workerInstanceId})` : "Offline"}
              </span>
            </div>

            {statusData.authError && (
              <div
                style={{
                  padding: "12px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: "8px",
                  color: "#f87171",
                  fontSize: "13px",
                }}
              >
                <strong>Authentication Error:</strong> {statusData.authError}
              </div>
            )}
          </div>
        </div>

        {/* QR Code Scanner Box */}
        <div className="glass-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          {isConnected ? (
            <div style={{ padding: "32px 0" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "var(--accent-green)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  margin: "0 auto 16px auto",
                  boxShadow: "0 0 25px rgba(16, 185, 129, 0.4)",
                }}
              >
                ✓
              </div>
              <h3 style={{ fontSize: "20px", color: "var(--accent-green)", marginBottom: "8px" }}>
                WhatsApp Connected Successfully
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "340px", margin: "0 auto" }}>
                Your LocalAuth session is securely saved and will automatically restore after server restarts.
              </p>
            </div>
          ) : statusData.qrCode ? (
            <div>
              <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Scan QR Code with Mobile</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "13px", maxWidth: "320px", marginBottom: "20px" }}>
                Open WhatsApp Business on your phone, go to Linked Devices, select Link a Device, and scan this QR code.
              </p>

              <div className="qr-container" style={{ margin: "12px 0" }}>
                <QRCodeSVG
                  value={statusData.qrCode}
                  size={240}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div style={{ fontSize: "12px", color: "var(--accent-cyan)", marginTop: "12px" }}>
                Live streaming status... QR code updates automatically.
              </div>
            </div>
          ) : (
            <div style={{ padding: "40px 0" }}>
              <h3 style={{ fontSize: "18px", marginBottom: "8px" }}>Connect Mobile Account</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "300px", margin: "0 auto 24px auto" }}>
                Click Connect WhatsApp below to initialize the browser worker and generate a unique QR code.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: "12px 24px" }}
                onClick={handleConnect}
                disabled={loading}
              >
                <span>📱</span>
                <span>Connect WhatsApp</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirmLogout && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: "20px", color: "var(--accent-red)", marginBottom: "12px" }}>
              Confirm WhatsApp Logout
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "24px" }}>
              Are you sure you want to disconnect and log out? This will destroy the saved LocalAuth session and require an administrator to scan a new QR code to resume messaging.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmLogout(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleLogout}
              >
                Yes, Disconnect & Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

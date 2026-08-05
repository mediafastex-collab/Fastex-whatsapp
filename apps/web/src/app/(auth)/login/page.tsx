"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@business.com");
  const [password, setPassword] = useState("Admin@123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: any = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillTestCredentials = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #10B981, #06B6D4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
              fontSize: "24px",
              fontWeight: "700",
              color: "#fff",
              boxShadow: "0 0 30px rgba(16, 185, 129, 0.4)",
            }}
          >
            WA
          </div>
          <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Fastex WhatsApp CRM</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            WhatsApp Web QR-Scanner Integration Suite
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
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Work Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@business.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: "28px" }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "14px", fontSize: "15px" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
          </button>
        </form>

        <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid var(--border-color)" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Quick Test Accounts (Click to Fill)
          </p>
          <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "13px", justifyContent: "space-between" }}
              onClick={() => fillTestCredentials("admin@business.com", "Admin@123456")}
            >
              <span>Administrator</span>
              <span style={{ opacity: 0.7 }}>admin@business.com</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "13px", justifyContent: "space-between" }}
              onClick={() => fillTestCredentials("sales1@business.com", "Sales@123456")}
            >
              <span>Salesperson 1</span>
              <span style={{ opacity: 0.7 }}>sales1@business.com</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: "13px", justifyContent: "space-between" }}
              onClick={() => fillTestCredentials("sales2@business.com", "Sales@123456")}
            >
              <span>Salesperson 2</span>
              <span style={{ opacity: 0.7 }}>sales2@business.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

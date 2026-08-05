"use client";

export const runtime = 'edge';

import React, { useEffect, useState } from "react";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SALESPERSON";
  createdAt: string;
  _count?: { leads: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  // create form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "SALESPERSON">("SALESPERSON");
  const [creating, setCreating] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  // reset-password modal
  const [resetUser, setResetUser] = useState<UserRow | null>(null);
  const [resetPwd, setResetPwd] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setPageError("");
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load users");
      setUsers(data);
    } catch (err: any) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      setFormMsg({ type: "success", text: `User "${data.user.name}" created.` });
      setName("");
      setEmail("");
      setPassword("");
      setRole("SALESPERSON");
      loadUsers();
    } catch (err: any) {
      setFormMsg({ type: "error", text: err.message });
    } finally {
      setCreating(false);
    }
  };

  const toggleRole = async (u: UserRow) => {
    const next = u.role === "ADMIN" ? "SALESPERSON" : "ADMIN";
    if (!confirm(`Change ${u.name}'s role to ${next}?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const doReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetBusy(true);
    setResetMsg("");
    try {
      const res = await fetch(`/api/users/${resetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPwd }),
      });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setResetUser(null);
      setResetPwd("");
      alert("Password updated successfully.");
    } catch (err: any) {
      setResetMsg(err.message);
    } finally {
      setResetBusy(false);
    }
  };

  const handleDelete = async (u: UserRow) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" });
      const data: any = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");
      loadUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Create team members, assign roles, and reset passwords.
          </p>
        </div>
      </div>

      {pageError && (
        <div className="glass-panel" style={{ padding: "20px", marginBottom: "24px", color: "#f87171" }}>
          {pageError}
        </div>
      )}

      {/* Create user */}
      <div className="glass-panel" style={{ padding: "24px", marginBottom: "28px" }}>
        <h2 style={{ marginBottom: "16px", fontSize: "18px" }}>Add New User</h2>

        {formMsg && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
              background: formMsg.type === "error" ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)",
              border: `1px solid ${formMsg.type === "error" ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.4)"}`,
              color: formMsg.type === "error" ? "#f87171" : "#34d399",
            }}
          >
            {formMsg.text}
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Priya Sharma" />
            </div>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@business.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Temporary Password</label>
              <input className="form-input" type="text" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min. 8 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={(e) => setRole(e.target.value as any)}>
                <option value="SALESPERSON">Salesperson</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Creating…" : "Create User"}
          </button>
        </form>
      </div>

      {/* Users list */}
      <h2 style={{ marginBottom: "16px", fontSize: "18px" }}>All Users {users.length > 0 && `(${users.length})`}</h2>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Leads</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: "28px", color: "var(--text-muted)" }}>No users found.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`user-role-badge role-${u.role}`}>{u.role}</span></td>
                  <td>{u._count?.leads ?? 0}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString("en-IN")}</td>
                  <td>
                    <div className="action-row">
                      <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => { setResetUser(u); setResetPwd(""); setResetMsg(""); }}>
                        Reset PW
                      </button>
                      <button className="btn btn-secondary" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => toggleRole(u)}>
                        {u.role === "ADMIN" ? "Make Sales" : "Make Admin"}
                      </button>
                      <button className="btn btn-danger" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={() => handleDelete(u)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reset password modal */}
      {resetUser && (
        <div className="modal-overlay" onClick={() => setResetUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginBottom: "8px" }}>Reset Password</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px" }}>
              Set a new password for <strong style={{ color: "#fff" }}>{resetUser.name}</strong> ({resetUser.email}).
            </p>
            {resetMsg && <div style={{ color: "#f87171", fontSize: "13px", marginBottom: "12px" }}>{resetMsg}</div>}
            <form onSubmit={doReset}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input className="form-input" type="text" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} required placeholder="Min. 8 characters" autoFocus />
              </div>
              <div className="action-row" style={{ justifyContent: "flex-end", marginTop: "8px" }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResetUser(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={resetBusy}>{resetBusy ? "Saving…" : "Update Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

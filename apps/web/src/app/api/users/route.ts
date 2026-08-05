export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

function authError(err: any) {
  const msg = err?.message || "Error";
  if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (msg.startsWith("FORBIDDEN")) return NextResponse.json({ error: msg }, { status: 403 });
  return NextResponse.json({ error: msg }, { status: 500 });
}

// GET /api/users — list all users (admin only)
export async function GET() {
  try {
    await requireAdmin();
    const prisma = getPrisma();

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: { select: { leads: true } },
      },
    });

    return NextResponse.json(users);
  } catch (err: any) {
    return authError(err);
  }
}

// POST /api/users — create a user (admin only)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const prisma = getPrisma();

    const body: any = await req.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const role = body.role === "ADMIN" ? "ADMIN" : "SALESPERSON";

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return authError(err);
  }
}

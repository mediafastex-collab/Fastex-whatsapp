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

// PUT /api/users/[id] — update name/role and/or reset password (admin only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const prisma = getPrisma();
    const body: any = await req.json();

    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const data: any = {};

    if (typeof body.name === "string" && body.name.trim()) {
      data.name = body.name.trim();
    }

    if (body.role === "ADMIN" || body.role === "SALESPERSON") {
      // Prevent removing the last administrator.
      if (target.role === "ADMIN" && body.role !== "ADMIN") {
        const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          return NextResponse.json({ error: "Cannot demote the only administrator" }, { status: 400 });
        }
      }
      data.role = body.role;
    }

    if (typeof body.password === "string" && body.password.length > 0) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      data.passwordHash = await hashPassword(body.password);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    return authError(err);
  }
}

// DELETE /api/users/[id] — delete a user (admin only)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const prisma = getPrisma();

    if (admin.id === params.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      include: { _count: { select: { leads: true } } },
    });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (target.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return NextResponse.json({ error: "Cannot delete the only administrator" }, { status: 400 });
      }
    }

    if (target._count.leads > 0) {
      return NextResponse.json(
        {
          error: `This user has ${target._count.leads} lead(s) assigned. Reassign or remove those leads before deleting.`,
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return authError(err);
  }
}

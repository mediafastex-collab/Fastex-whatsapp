import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@fastex/database";
import { signAuthToken } from "@/lib/auth";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "fastex_salt_2026").digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await signAuthToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as "ADMIN" | "SALESPERSON",
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    res.cookies.set("fastex_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { callWorkerApi } from "@/lib/worker-client";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const result = await callWorkerApi("/test-message", { method: "POST", body });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

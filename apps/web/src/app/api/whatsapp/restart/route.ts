import { NextResponse } from "next/server";
import { callWorkerApi } from "@/lib/worker-client";
import { requireAdmin } from "@/lib/auth";

export async function POST() {
  try {
    await requireAdmin();
    const result = await callWorkerApi("/restart", { method: "POST" });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

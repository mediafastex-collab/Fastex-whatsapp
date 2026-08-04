import { NextResponse } from "next/server";
import { callWorkerApi } from "@/lib/worker-client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@fastex/database";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let workerStatus = null;
    try {
      workerStatus = await callWorkerApi("/status");
    } catch (e: any) {
      console.warn("Could not reach WhatsApp Worker on GET /status:", e.message);
    }

    const dbSession = await prisma.whatsAppSession.findUnique({
      where: { sessionName: "main-business-whatsapp" },
    });

    return NextResponse.json({
      workerStatus: workerStatus || {
        connectionStatus: dbSession?.connectionStatus || "NOT_CONNECTED",
        authError: dbSession?.lastError || "Worker unreachable",
      },
      dbSession: dbSession || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

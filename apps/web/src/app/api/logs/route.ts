export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@fastex/database";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);

    const customerName = searchParams.get("customerName") || "";
    const mobileNumber = searchParams.get("mobileNumber") || "";
    const salespersonId = searchParams.get("salespersonId") || "";
    const status = searchParams.get("status") || "";
    const messageType = searchParams.get("messageType") || ""; // 'AUTOMATIC_WELCOME' or 'MANUAL_*'
    const leadId = searchParams.get("leadId") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const where: any = {};

    // Salespersons can only view logs for their own leads unless Admin
    if (user.role !== "ADMIN") {
      where.lead = {
        salespersonId: user.id,
      };
    } else if (salespersonId) {
      where.lead = {
        salespersonId,
      };
    }

    if (customerName) {
      where.lead = {
        ...where.lead,
        customerName: { contains: customerName, mode: "insensitive" },
      };
    }

    if (mobileNumber) {
      where.recipientNumber = { contains: mobileNumber };
    }

    if (status) {
      where.status = status;
    }

    if (messageType) {
      if (messageType === "AUTOMATIC") {
        where.messageType = "AUTOMATIC_WELCOME";
      } else if (messageType === "MANUAL") {
        where.messageType = {
          in: ["MANUAL_WELCOME", "MANUAL_CUSTOM", "RETRY", "TEST"],
        };
      } else {
        where.messageType = messageType;
      }
    }

    if (leadId) {
      where.leadId = leadId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const logs = await prisma.whatsAppMessage.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            customerName: true,
            salesperson: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

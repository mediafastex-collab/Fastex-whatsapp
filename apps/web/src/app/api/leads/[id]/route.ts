import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@fastex/database";
import { renderWhatsAppMessage } from "@fastex/shared";
import { requireUser } from "@/lib/auth";
import { callWorkerApi } from "@/lib/worker-client";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const leadId = params.id;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        salesperson: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && lead.salespersonId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You cannot access leads belonging to another salesperson" }, { status: 403 });
    }

    return NextResponse.json(lead);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const leadId = params.id;
    const body = await req.json();
    const { action, customMessage } = body; // action: 'send-welcome' | 'resend-failed' | 'send-custom'

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { salesperson: true },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && lead.salespersonId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You cannot send messages for leads belonging to another salesperson" }, { status: 403 });
    }

    const settings = await prisma.whatsAppSettings.findFirst();

    let content = "";
    let messageType = "MANUAL_WELCOME";
    let idempotencyKey = undefined;

    if (action === "send-welcome") {
      content = renderWhatsAppMessage(
        settings?.defaultMessage ||
          "Hello {{customer_name}}, thank you for visiting {{business_name}}. It was great meeting you. {{salesperson_name}} will contact you shortly.",
        {
          customer_name: lead.customerName,
          customer_mobile: lead.normalizedNumber,
          business_name: lead.businessName || settings?.businessName || "Fastex Collaborations",
          business_category: lead.businessCategory || "",
          salesperson_name: lead.salesperson.name,
          note: lead.note || "",
          date: new Date().toLocaleDateString("en-IN"),
        }
      );
      messageType = "MANUAL_WELCOME";
    } else if (action === "resend-failed") {
      // Find latest failed message
      const lastFailed = await prisma.whatsAppMessage.findFirst({
        where: { leadId: lead.id, status: "FAILED" },
        orderBy: { failedAt: "desc" },
      });
      content = lastFailed?.messageContent || "Hello, checking in from Fastex Collaborations.";
      messageType = "RETRY";
    } else if (action === "send-custom") {
      if (!customMessage || !customMessage.trim()) {
        return NextResponse.json({ error: "Custom message text is required" }, { status: 400 });
      }
      content = customMessage.trim();
      messageType = "MANUAL_CUSTOM";
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const res = await callWorkerApi("/queue-message", {
      method: "POST",
      body: {
        leadId: lead.id,
        recipientNumber: lead.normalizedNumber,
        messageContent: content,
        messageType,
        idempotencyKey,
      },
    });

    return NextResponse.json(res);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const leadId = params.id;
    const body = await req.json();

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && lead.salespersonId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You cannot modify leads belonging to another salesperson" }, { status: 403 });
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        customerName: body.customerName !== undefined ? body.customerName : lead.customerName,
        businessName: body.businessName !== undefined ? body.businessName : lead.businessName,
        businessCategory: body.businessCategory !== undefined ? body.businessCategory : lead.businessCategory,
        note: body.note !== undefined ? body.note : lead.note,
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


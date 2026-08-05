export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = getPrisma();
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = getPrisma();
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
        leadStatus: body.leadStatus !== undefined ? body.leadStatus : lead.leadStatus,
        note: body.note !== undefined ? body.note : lead.note,
      },
    });

    if (body.markContacted) {
      await prisma.whatsAppMessage.create({
        data: {
          leadId: lead.id,
          recipientNumber: lead.normalizedNumber,
          messageContent: body.messageContent || "Dhanera Business Group - Monsoon Edit 2026 message sent via WhatsApp Click-to-Chat",
          status: "SENT",
          messageType: "CLICK_TO_CHAT",
          sentAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const prisma = getPrisma();
  try {
    const user = await requireUser();
    const leadId = params.id;

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    if (user.role !== "ADMIN" && lead.salespersonId !== user.id) {
      return NextResponse.json({ error: "Forbidden: You cannot delete leads belonging to another salesperson" }, { status: 403 });
    }

    await prisma.whatsAppMessage.deleteMany({
      where: { leadId },
    });

    await prisma.lead.delete({
      where: { id: leadId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}




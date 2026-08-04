import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@fastex/database";
import { normalizeMobileNumber, renderWhatsAppMessage } from "@fastex/shared";
import { requireUser } from "@/lib/auth";
import { callWorkerApi } from "@/lib/worker-client";

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: any = {};
    // Salespersons see only their own leads, Admin sees all leads
    if (user.role !== "ADMIN") {
      where.salespersonId = user.id;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { originalNumber: { contains: search } },
        { normalizedNumber: { contains: search } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      include: {
        salesperson: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();

    const {
      customerName,
      originalNumber,
      consentProvided,
      consentText,
      consentLocation,
      businessName,
      businessCategory,
      note,
      followUpDate,
    } = body;

    if (!customerName || !originalNumber) {
      return NextResponse.json({ error: "Customer name and mobile number are required" }, { status: 400 });
    }

    const normalized = normalizeMobileNumber(originalNumber, "+91");

    // 1. Save Lead in database even if number is invalid or WhatsApp is disconnected
    const lead = await prisma.lead.create({
      data: {
        customerName: customerName.trim(),
        originalNumber: originalNumber.trim(),
        countryCode: normalized.countryCode,
        normalizedNumber: normalized.normalizedNumber || originalNumber.trim(),
        recipientId: normalized.recipientId || `${originalNumber.trim()}@c.us`,
        isValidNumber: normalized.isValid,
        consentProvided: !!consentProvided,
        consentTimestamp: consentProvided ? new Date() : null,
        consentText: consentText || "I agree to receive information and follow-up messages from this business through WhatsApp.",
        consentLocation: consentLocation || "Lead CRM Dashboard",
        salespersonId: user.id,
        businessName: businessName || null,
        businessCategory: businessCategory || null,
        note: note || null,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
      },
      include: {
        salesperson: { select: { id: true, name: true, email: true } },
      },
    });

    // 2. Check settings & consent requirement for automatic welcome message
    const settings = await prisma.whatsAppSettings.findFirst();
    const canSendAutoMsg =
      settings?.activeStatus !== false &&
      normalized.isValid &&
      (!settings?.consentRequired || lead.consentProvided);

    let messageQueueResult = null;

    if (canSendAutoMsg) {
      const renderedContent = renderWhatsAppMessage(
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

      try {
        messageQueueResult = await callWorkerApi("/queue-message", {
          method: "POST",
          body: {
            leadId: lead.id,
            recipientNumber: lead.normalizedNumber,
            messageContent: renderedContent,
            messageType: "AUTOMATIC_WELCOME",
            idempotencyKey: `lead_${lead.id}_welcome`,
          },
        });
      } catch (queueErr: any) {
        console.warn("Could not enqueue automatic welcome message:", queueErr.message);
        // We still return success for Lead creation as required
      }
    }

    return NextResponse.json({
      success: true,
      lead,
      messageQueued: !!messageQueueResult?.success,
      messageDetails: messageQueueResult || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

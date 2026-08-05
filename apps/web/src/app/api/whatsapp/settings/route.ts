export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const prisma = getPrisma();
  try {
    await requireAdmin();
    let settings = await prisma.whatsAppSettings.findFirst();
    if (!settings) {
      settings = await prisma.whatsAppSettings.create({
        data: {},
      });
    }
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const prisma = getPrisma();
  try {
    await requireAdmin();
    const body = await req.json();

    const existing = await prisma.whatsAppSettings.findFirst();
    let updated;
    if (existing) {
      updated = await prisma.whatsAppSettings.update({
        where: { id: existing.id },
        data: {
          activeStatus: body.activeStatus ?? existing.activeStatus,
          defaultMessage: body.defaultMessage ?? existing.defaultMessage,
          delaySeconds: body.delaySeconds ?? existing.delaySeconds,
          maxPerMinute: body.maxPerMinute ?? existing.maxPerMinute,
          maxRetryCount: body.maxRetryCount ?? existing.maxRetryCount,
          minDelayBetweenMs: body.minDelayBetweenMs ?? existing.minDelayBetweenMs,
          consentRequired: body.consentRequired ?? existing.consentRequired,
          businessName: body.businessName ?? existing.businessName,
          fallbackMessage: body.fallbackMessage ?? existing.fallbackMessage,
          testRecipient: body.testRecipient ?? existing.testRecipient,
        },
      });
    } else {
      updated = await prisma.whatsAppSettings.create({
        data: body,
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

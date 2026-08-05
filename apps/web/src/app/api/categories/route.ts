export const runtime = 'edge';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@fastex/database";
import { requireUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await requireUser();

    // Fetch distinct business categories saved in master
    const leads = await prisma.lead.findMany({
      where: {
        businessCategory: {
          not: null,
        },
      },
      select: {
        businessCategory: true,
      },
      distinct: ["businessCategory"],
    });

    const defaultCategories = [
      "Event Production",
      "Corporate Partner",
      "Media & Advertising",
      "Retail & E-commerce",
      "Healthcare & Medical",
      "Real Estate & Property",
      "Hospitality & Restaurants",
      "Technology & SaaS",
      "Logistics & Supply Chain",
      "Education & Training",
      "Finance & Legal",
      "Creative & Design",
    ];

    const savedCategories = leads
      .map((l: any) => l.businessCategory)
      .filter((cat: any): cat is string => typeof cat === "string" && cat.trim() !== "");

    // Merge default and saved master categories without duplicates
    const allCategories = Array.from(new Set([...defaultCategories, ...savedCategories])).sort();

    return NextResponse.json(allCategories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

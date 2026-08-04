import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "fastex_salt_2026").digest("hex");
}

async function main() {
  console.log("Seeding database...");

  // Seed Admin user
  const adminEmail = "admin@business.com";
  const adminPassword = "Admin@123456";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "System Administrator",
      passwordHash: hashPassword(adminPassword),
      role: "ADMIN",
    },
  });
  console.log(`Seeded Admin: ${admin.email}`);

  // Seed Salesperson 1
  const sales1Email = "sales1@business.com";
  const sales1 = await prisma.user.upsert({
    where: { email: sales1Email },
    update: {},
    create: {
      email: sales1Email,
      name: "Aagam Shah (Sales)",
      passwordHash: hashPassword("Sales@123456"),
      role: "SALESPERSON",
    },
  });
  console.log(`Seeded Salesperson 1: ${sales1.email}`);

  // Seed Salesperson 2
  const sales2Email = "sales2@business.com";
  const sales2 = await prisma.user.upsert({
    where: { email: sales2Email },
    update: {},
    create: {
      email: sales2Email,
      name: "Rohan Verma (Sales)",
      passwordHash: hashPassword("Sales@123456"),
      role: "SALESPERSON",
    },
  });
  console.log(`Seeded Salesperson 2: ${sales2.email}`);

  // Ensure default WhatsAppSettings exists
  const settings = await prisma.whatsAppSettings.findFirst();
  if (!settings) {
    await prisma.whatsAppSettings.create({
      data: {
        activeStatus: true,
        defaultMessage:
          "Hello {{customer_name}}, thank you for visiting {{business_name}}. It was great meeting you. {{salesperson_name}} will contact you shortly.",
        delaySeconds: 0,
        maxPerMinute: 10,
        maxRetryCount: 2,
        minDelayBetweenMs: 4000,
        consentRequired: true,
        businessName: "Fastex Collaborations",
        fallbackMessage: "Hello, thank you for connecting with us.",
      },
    });
    console.log("Seeded default WhatsAppSettings.");
  }

  // Ensure default WhatsAppSession exists
  const session = await prisma.whatsAppSession.findUnique({
    where: { sessionName: "main-business-whatsapp" },
  });
  if (!session) {
    await prisma.whatsAppSession.create({
      data: {
        sessionName: "main-business-whatsapp",
        connectionStatus: "NOT_CONNECTED",
        authStatus: "UNAUTHENTICATED",
      },
    });
    console.log("Seeded default WhatsAppSession.");
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALESPERSON',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerName" TEXT NOT NULL,
    "originalNumber" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT '+91',
    "normalizedNumber" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "isValidNumber" BOOLEAN NOT NULL DEFAULT true,
    "isRegisteredOnWa" BOOLEAN,
    "consentProvided" BOOLEAN NOT NULL DEFAULT false,
    "consentTimestamp" DATETIME,
    "consentText" TEXT,
    "consentLocation" TEXT,
    "salespersonId" TEXT NOT NULL,
    "businessName" TEXT,
    "businessCategory" TEXT,
    "leadStatus" TEXT NOT NULL DEFAULT 'HOT LEAD',
    "note" TEXT,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionName" TEXT NOT NULL DEFAULT 'main-business-whatsapp',
    "phoneNumber" TEXT,
    "profileName" TEXT,
    "connectionStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "lastConnectedAt" DATETIME,
    "lastDisconnectedAt" DATETIME,
    "lastQrGeneratedAt" DATETIME,
    "lastSuccessfulMsgAt" DATETIME,
    "authStatus" TEXT NOT NULL DEFAULT 'UNAUTHENTICATED',
    "workerInstanceId" TEXT,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leadId" TEXT,
    "recipientNumber" TEXT NOT NULL,
    "whatsappMessageId" TEXT,
    "messageContent" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'AUTOMATIC_WELCOME',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "idempotencyKey" TEXT,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "queuedAt" DATETIME,
    "sentAt" DATETIME,
    "acknowledgedAt" DATETIME,
    "deliveredAt" DATETIME,
    "readAt" DATETIME,
    "failedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WhatsAppMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhatsAppSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activeStatus" BOOLEAN NOT NULL DEFAULT true,
    "defaultMessage" TEXT NOT NULL DEFAULT 'Hello {{customer_name}}, thank you for visiting {{business_name}}. It was great meeting you. {{salesperson_name}} will contact you shortly.',
    "delaySeconds" INTEGER NOT NULL DEFAULT 0,
    "maxPerMinute" INTEGER NOT NULL DEFAULT 10,
    "maxRetryCount" INTEGER NOT NULL DEFAULT 2,
    "minDelayBetweenMs" INTEGER NOT NULL DEFAULT 4000,
    "consentRequired" BOOLEAN NOT NULL DEFAULT true,
    "businessName" TEXT NOT NULL DEFAULT 'Fastex Collaborations',
    "fallbackMessage" TEXT NOT NULL DEFAULT 'Hello, thank you for connecting with us.',
    "testRecipient" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_sessionName_key" ON "WhatsAppSession"("sessionName");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_whatsappMessageId_key" ON "WhatsAppMessage"("whatsappMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_idempotencyKey_key" ON "WhatsAppMessage"("idempotencyKey");


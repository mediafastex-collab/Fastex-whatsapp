-- Seed data for Fastex WhatsApp CRM (idempotent via INSERT OR IGNORE on unique keys)
-- Passwords: admin@business.com/Admin@123456, sales1|sales2@business.com/Sales@123456

-- Users
INSERT OR IGNORE INTO "User" ("id","email","name","passwordHash","role","updatedAt") VALUES
  ('c4eef9f3-cdfa-4079-a4e3-750f5e13b912','admin@business.com','System Administrator','0ada32d57c38f4b32d7d2b3ec32fb009701b0f36575c82628aea0df8ddfa4d59','ADMIN',CURRENT_TIMESTAMP),
  ('809b2ca9-fdb7-4ce2-85da-2391c00113ac','sales1@business.com','Aagam Shah (Sales)','ce6c124dd7417b18411c4e18ce29b1749fc60a4a91f9fea60a0afff99aa85629','SALESPERSON',CURRENT_TIMESTAMP),
  ('a84ab575-bf2c-4ceb-99fe-2f348e27aea2','sales2@business.com','Rohan Verma (Sales)','ce6c124dd7417b18411c4e18ce29b1749fc60a4a91f9fea60a0afff99aa85629','SALESPERSON',CURRENT_TIMESTAMP);

-- Default WhatsApp settings
INSERT OR IGNORE INTO "WhatsAppSettings" ("id","defaultMessage","businessName","updatedAt") VALUES
  ('256c3d00-428b-4083-bc34-7e8ff9fa15d4','Hello {{customer_name}}, thank you for visiting {{business_name}}. It was great meeting you. {{salesperson_name}} will contact you shortly.','Fastex Collaborations',CURRENT_TIMESTAMP);

-- Default WhatsApp session row
INSERT OR IGNORE INTO "WhatsAppSession" ("id","sessionName","connectionStatus","authStatus","updatedAt") VALUES
  ('20bd03d1-2431-4b0b-a304-48b08696ef3b','main-business-whatsapp','NOT_CONNECTED','UNAUTHENTICATED',CURRENT_TIMESTAMP);

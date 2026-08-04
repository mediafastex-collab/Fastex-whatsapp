# Fastex WhatsApp Web QR-Scanner Integration

An enterprise-ready, unofficial WhatsApp Web QR-Code scanner integration and CRM lead management system built with **Next.js 14 (App Router)**, **Node.js WhatsApp Worker Service**, **PostgreSQL (Prisma ORM)**, and **Redis (BullMQ)**.

## Features
- **Direct WhatsApp Web QR-Code Scan**: Connect any existing WhatsApp Business mobile account without Meta Cloud API or per-message fees.
- **Persistent LocalAuth Authentication**: Sessions survive server and container restarts in persistent Docker volumes (`/app/.wwebjs_auth`).
- **Reliable Background Job Queue**: Non-blocking lead submission with BullMQ message queueing, retry policies, and offline queue holding.
- **Message Acknowledgement Tracking**: Real-time status progression (`PENDING` -> `QUEUED` -> `SENT` -> `DELIVERED` -> `READ` -> `ACKNOWLEDGED` / `FAILED`).
- **Role-Based Access Control (RBAC)**: Administrator dashboard for connection & settings management; Salesperson interface for consent-backed lead submission.
- **Indian Mobile Number Normalization**: Automatically converts and cleans numbers to India `+91` international format without `+` for chat IDs.

## Quickstart (Docker Compose)
```bash
# Start all services (web, worker, postgres, redis)
docker compose up --build -d
```

### Seeded Credentials for Testing
- **Admin**: `admin@business.com` / `Admin@123456`
- **Salesperson 1**: `sales1@business.com` / `Sales@123456`
- **Salesperson 2**: `sales2@business.com` / `Sales@123456`

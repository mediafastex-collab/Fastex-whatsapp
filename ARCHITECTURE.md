# System Architecture - WhatsApp Web QR-Scanner Integration

## Services
1. **`apps/web` (Next.js 14 App Router)**:
   - Port `3000`
   - Handles Admin Dashboard, Lead CRM, UI/UX, and WebSocket/SSE real-time status display.
   - Communicates with Worker via Internal API protected by HMAC-SHA256 signatures and shared API keys.
2. **`apps/worker` (Node.js WhatsApp Worker Service)**:
   - Port `4000`
   - Manages Puppeteer / Chromium browser process with `whatsapp-web.js`.
   - Uses `LocalAuth` with client ID `main-business-whatsapp`.
   - BullMQ worker processing outgoing messages with configurable rate throttling (default: 10/min, 4s inter-message delay).
   - Distributed Redis lock (`whatsapp:worker:session_lock`) guarantees only one worker instance controls the session.
3. **`postgres` (PostgreSQL 16)**:
   - Port `5432`
   - Persistent storage for users, leads, sessions, message logs, and settings.
4. **`redis` (Redis 7)**:
   - Port `6379`
   - Backend for BullMQ outgoing message queue and worker session locking.

## Real-Time Event Flow
- When Admin clicks **Connect WhatsApp** on `/whatsapp/connection`, Next.js invokes `POST /api/internal/whatsapp/initialize` on Worker.
- Worker emits `qr` events via Server-Sent Events (SSE) stream `/api/internal/whatsapp/stream`.
- Next.js renders the QR code securely in the Admin Dashboard.
- When mobile scans the QR, Worker emits `authenticated` and `ready` events, updates database `WhatsAppSession` status to `CONNECTED`, and resumes BullMQ message processing.

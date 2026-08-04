# Unofficial WhatsApp Web Integration Notice

## Critical Warning for Administrators and Developers

This application connects to WhatsApp through **WhatsApp Web QR-code authentication** using `whatsapp-web.js` and automated Chromium/Puppeteer browsers. It does **not** use the official Meta WhatsApp Business Cloud API.

### Important Considerations:
1. **Unofficial Protocol**: This integration automates the WhatsApp Web interface. Changes made by Meta to WhatsApp Web protocols, HTML structure, or session handshakes may temporarily interrupt messaging until the underlying library (`whatsapp-web.js`) is updated.
2. **Session Persistence & Connectivity**:
   - The WhatsApp account must remain active on the administrator's linked mobile device.
   - Prolonged mobile network disconnection or phone power-off can cause the WhatsApp Web session to disconnect.
   - Authentication data is stored locally in the persistent Docker volume `/app/.wwebjs_auth`.
3. **Anti-Spam & Messaging Safety**:
   - Avoid unsolicited, bulk, or excessive automated messaging.
   - Always ensure customer **consent** is collected before sending automated follow-up messages.
   - Implementing bulk scraping, spam campaigns, or automated group joining is strictly prohibited and can lead to immediate WhatsApp account restriction or ban by Meta.
4. **Offline Resilience**:
   - When disconnected, outgoing messages remain in the queue (`QUEUED` or `PENDING` status).
   - Once the administrator re-links the session or the connection is restored, queued messages will automatically resume sending subject to configured rate limits (e.g., max 10 messages/min, minimum 4s delay).

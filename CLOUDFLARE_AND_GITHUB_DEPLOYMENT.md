# 🚀 Connecting to GitHub & Deploying Live with Cloudflare

This guide explains how to connect your **Fastex WhatsApp CRM** repository to GitHub and expose it live to the internet using **Cloudflare** (via Cloudflare Tunnels or Cloudflare DNS/VPS).

---

## Part 1: Connect & Push to GitHub

The local git repository has been initialized on the `main` branch with all 65 files committed.

### Step 1: Create a Repository on GitHub
1. Go to [https://github.com/new](https://github.com/new) and log into your GitHub account.
2. Name your repository (e.g., `fastex-whatsapp-crm`).
3. Set it to **Private** (recommended since it contains CRM credentials).
4. Do **not** initialize with a README or `.gitignore` (they are already included).
5. Click **Create repository**.

### Step 2: Push Your Code
Open your terminal in `/Users/aagamshah/Documents/Fastex Whatsapp` and run:

```bash
git remote add origin https://github.com/<YOUR-USERNAME>/fastex-whatsapp-crm.git
git branch -M main
git push -u origin main
```

---

## Part 2: Go Live with Cloudflare

Because the **WhatsApp Worker Service (`@fastex/worker`)** runs a persistent Chromium browser process to maintain the WhatsApp Web session (`LocalAuth`), it must run on a server or computer that stays running (VPS, Docker, or Dedicated PC).

### Option A: Cloudflare Tunnel (`cloudflared`) — RECOMMENDED ⭐
Cloudflare Tunnels allow you to expose your CRM to your domain (e.g., `crm.yourbusiness.com`) with **automatic free SSL (HTTPS)** without opening firewall ports or needing a static IP.

#### 1. Quick Test Tunnel (Instant Public URL)
If you want an instant HTTPS URL right now to share or test:
```bash
# Install cloudflared (macOS)
brew install cloudflared

# Expose your Next.js Dashboard on port 3001
cloudflared tunnel --url http://localhost:3001
```
Cloudflare will output a public URL like `https://quick-test-name.trycloudflare.com` that connects securely to your CRM!

#### 2. Production Tunnel with Your Custom Domain
1. Log into your **Cloudflare Zero Trust Dashboard** -> **Networks** -> **Tunnels**.
2. Click **Create a Tunnel** -> select **Cloudflared**.
3. Give it a name (e.g., `fastex-crm-tunnel`).
4. In the **Public Hostnames** tab, add your domain:
   - **Subdomain**: `crm`
   - **Domain**: `yourdomain.com`
   - **Service**: `HTTP` -> `localhost:3001` (or `localhost:3000` if in Docker)
5. Install and run the service connector command provided by Cloudflare on your server.

---

### Option B: VPS Deployment + Cloudflare DNS Proxy

If deploying to a cloud server (DigitalOcean, AWS, Hetzner, etc.):

1. **Point Cloudflare DNS**:
   - In your Cloudflare DNS settings, create an **A Record** for `crm.yourdomain.com` pointing to your VPS Public IP.
   - Turn ON the **Orange Proxy Cloud** (enables DDoS protection and SSL).
   - Under **SSL/TLS**, set encryption mode to **Full** or **Full (strict)**.

2. **Deploy on Server via Docker Compose**:
   ```bash
   # Clone repo on your server
   git clone https://github.com/<YOUR-USERNAME>/fastex-whatsapp-crm.git
   cd fastex-whatsapp-crm

   # Start containers (Web dashboard + Worker + Postgres + Redis)
   docker compose up -d --build
   ```

3. **Persistent WhatsApp Session**:
   - The WhatsApp authentication tokens are stored in the `./docker-data/whatsapp-auth` volume.
   - When you scan the QR code once, the session remains active indefinitely across server restarts.

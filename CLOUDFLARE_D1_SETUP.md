# ☁️ Cloudflare D1 Database & Cloudflare Pages Setup Guide

Your CRM has been upgraded to support **Cloudflare D1** (Cloudflare's Serverless SQL Database at the Edge) while remaining 100% compatible with local development!

---

## 🔧 Step 1: Create Your D1 Database in Cloudflare
1. Go to your **Cloudflare Dashboard** -> click **Workers & Pages** -> **D1**.
2. Click **Create database** -> name it `fastex-crm-db` -> click **Create**.
3. Once created, copy the **Database ID** (it looks like a UUID string, e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

---

## 🔗 Step 2: Bind D1 to Your Cloudflare Pages App (`fastex-whatsapp.pages.dev`)
1. In your **Cloudflare Dashboard**, go to **Workers & Pages** -> **Overview** -> click **fastex-whatsapp**.
2. Go to **Settings** -> **Functions** -> scroll down to **D1 database bindings**.
3. Click **Add binding**:
   - **Variable name**: `DB`
   - **D1 database**: Select `fastex-crm-db`
4. Click **Save**.

---

## ⚙️ Step 3: Configure Cloudflare Pages Build Settings (Fixing the 404 Error)
To make sure Cloudflare Pages builds your Next.js CRM correctly instead of returning `404 page can't be found`:
1. In your **fastex-whatsapp** project in Cloudflare Pages, go to **Settings** -> **Build & deployments**.
2. Click **Edit configurations** and set:
   - **Framework preset**: `Next.js`
   - **Build command**: `npx @cloudflare/next-on-pages` (or leave default if using automatic Vercel/Next preset)
   - **Build output directory**: `.vercel/output/static` (or `.next` depending on preset)
   - **Root directory**: `apps/web` *(Important: Since this is a monorepo, set Root directory to `apps/web`!)*
3. Click **Save** and trigger a **Retry deployment**!

Your CRM will now run live on `https://fastex-whatsapp.pages.dev` backed by your serverless Cloudflare D1 SQL database!

# 🚀 Deploying AADDA to Vercel

This repository is fully configured for seamless deployment on **Vercel**.

---

## ⚡ Quick 1-Click Deploy via Vercel Dashboard

### Step 1: Import Repository
1. Log in to your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your GitHub repository (`chatapp` or `aadda`).

### Step 2: Configure Build & Output
Vercel will automatically read `vercel.json`:
- **Framework Preset**: `Other`
- **Root Directory**: `./` (leave default) or `apps/mobile` (both `vercel.json` are included)
- **Build Command**: `pnpm --filter @aadda/mobile run export:web`
- **Output Directory**: `apps/mobile/dist` (or `dist` if root dir is `apps/mobile`)

### Step 3: Environment Variables
Under **Environment Variables**, add:
| Key | Example Value | Description |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | `https://your-api.up.railway.app/api` | The URL of your deployed NestJS backend |
| `EXPO_PUBLIC_SOCKET_URL` | `https://your-api.up.railway.app` | The WebSocket URL for real-time chat |

> 💡 **Note**: For testing without a separate backend URL, Vercel will serve the static web app, and requests will default to `/api`.

### Step 4: Click Deploy 🎉
Your app will build and be live at `https://your-project.vercel.app`!

---

## 💻 Deploy via Vercel CLI (Alternative)

If you have the Vercel CLI installed:
```bash
# 1. Install Vercel CLI globally
npm i -g vercel

# 2. Deploy directly from repository root
vercel

# 3. For production release
vercel --prod
```

---

## 📦 What Files Were Configured?
- `vercel.json` (Root): Directs Vercel to build the Expo web application and route all SPA pages to `/index.html`.
- `apps/mobile/vercel.json`: Fallback configuration if project root is set to `apps/mobile`.
- `package.json`: Contains `"build:web"` script.
- `apps/mobile/src/services/api.ts` & `socket.ts`: Configured with dynamic detection for Vercel production domains and custom API endpoints.


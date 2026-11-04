# TaskFlow Deployment & Configuration Guide

This guide covers setting up TaskFlow locally and deploying to Vercel with Neon PostgreSQL and SMTP email authentication.

---

## 1. Prerequisites

- **Node.js:** v18.x, v20.x, or v22.x
- **Package Manager:** npm or yarn
- **Database:** [Neon PostgreSQL](https://neon.tech)
- **SMTP Account:** Gmail (with App Password), SendGrid, Mailgun, or any standard SMTP server

---

## 2. Environment Variables

Create `server/.env` based on `server/.env.example`:

```ini
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Neon PostgreSQL
# Use pooled connection for serverless queries:
DATABASE_URL="postgresql://neondb_owner:[PASSWORD]@[HOST]-pooler.neon.tech/neondb?sslmode=require"
# Use direct connection for Prisma migrations:
DIRECT_URL="postgresql://neondb_owner:[PASSWORD]@[HOST].neon.tech/neondb?sslmode=require"

# JWT Authentication
JWT_SECRET=your_secure_random_64_character_hex_secret
JWT_EXPIRES_IN=7d

# SMTP Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
SMTP_FROM="TaskFlow Academic Portal <noreply@taskflow.edu>"

# OTP HMAC Hashing Secret (Hex string)
OTP_SECRET=your_secure_random_64_character_hex_secret

# Optional: Neon S3-Compatible Storage
AWS_ENDPOINT_URL_S3=https://[STORAGE_HOST].neon.tech
AWS_ACCESS_KEY_ID=nak_your_access_key
AWS_SECRET_ACCESS_KEY=nsk_your_secret_key
AWS_REGION=us-east-1
```

Create `client/.env` based on `client/.env.example`:

```ini
VITE_API_URL=http://localhost:5000/api/v1
```

---

## 3. Local Development Setup

### 3.1 Install Dependencies
```bash
# In project root:
cd server && npm install
cd ../client && npm install
```

### 3.2 Synchronize Database & Generate Prisma Client
```bash
cd server
npx prisma db push
npm run prisma:seed
```

### 3.3 Run Applications
```bash
# Terminal 1: Backend API
cd server
npm run dev

# Terminal 2: Frontend Client
cd client
npm run dev
```

Visit `http://localhost:5173` to access TaskFlow.

---

## 4. Deploying to Vercel

TaskFlow is configured as a multi-service Vercel project via `vercel.json` (`client` as Vite SPA, `server` as Express API).

### 4.1 Step 1: Push Code to GitHub
Ensure the latest code is on branch `main`:
```bash
git push origin main
```

### 4.2 Step 2: Configure Environment Variables in Vercel
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard).
2. Open your project (e.g. `task-management-system-` or `taskmanagerklu`).
3. Navigate to **Settings** $\rightarrow$ **Environment Variables**.
4. Add the following environment variables for **Production**, **Preview**, and **Development**:

| Key | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon PostgreSQL pooled URL | `postgresql://neondb_owner:...@ep-...-pooler.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Neon direct URL | `postgresql://neondb_owner:...@ep-....neon.tech/neondb?sslmode=require` |
| `JWT_SECRET` | 256-bit Hex JWT Secret | Generated random 64-char string |
| `OTP_SECRET` | 256-bit Hex OTP Secret | Generated random 64-char string |
| `NODE_ENV` | Environment mode | `production` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Secure flag | `false` |
| `SMTP_USER` | SMTP username | `your_email@gmail.com` |
| `SMTP_PASS` | SMTP app password | `your_16_char_app_password` |
| `SMTP_FROM` | Sender address | `"TaskFlow Portal <noreply@taskflow.edu>"` |

### 4.3 Step 3: Trigger Redeployment
1. In the Vercel Dashboard, go to **Deployments**.
2. Click the three dots (`...`) on the latest commit $\rightarrow$ click **Redeploy**.
3. Once the build completes, visit your production domain:
   - `https://taskmanagerklu.vercel.app/`


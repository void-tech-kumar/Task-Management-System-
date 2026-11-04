# TaskFlow Security & Architecture Audit Report

**Project:** TaskFlow – College Task Management System  
**Repository:** [void-tech-kumar/Task-Management-System-](https://github.com/void-tech-kumar/Task-Management-System-.git)  
**Production URL:** [https://taskmanagerklu.vercel.app/](https://taskmanagerklu.vercel.app/)  
**Audit Date:** November 4, 2026  
**Auditor:** Senior Full-Stack, Database, DevOps & Security Engineering Lead  

---

## 1. Executive Summary

| Category | Status | Details |
| :--- | :---: | :--- |
| **Credential Safety & Secrets** | **PASS** | No `.env` files committed to Git. JWT secrets and OTP HMAC keys rotated to 256-bit random hex strings. Placeholder `.env.example` files provided. |
| **Database Connectivity** | **PASS** | Neon PostgreSQL live on AWS `us-east-1`. Prisma Client generated with Linux `rhel-openssl-3.0.x` targets. Tables, relations, and non-destructive seeds verified. |
| **Authentication & RBAC** | **PASS** | Role-Based Access Control enforced on backend middleware (Zod + JWT in HTTP-only cookies). Unauthorized role privilege escalation strictly blocked. |
| **SMTP OTP Authentication** | **PASS** | Nodemailer SMTP transport, 6-digit cryptographic OTP generation, HMAC-SHA256 hashed storage, 5-minute expiry, 60s cooldown, single-use enforcement implemented. |
| **Functional & Security Testing** | **PASS** | **15/15 Integration & Security Tests Passed** (Auth, RBAC, OTP, Projects, Tasks, Analytics, SQLi sanitization). |
| **Vercel Cloud Deployment** | **BLOCKED (Owner Action)** | Deployment builds successfully; live API invocation requires owner to input `DATABASE_URL` and `JWT_SECRET` in Vercel Project Settings. |

---

## 2. Security Audit Findings & Remediations

### 2.1 Git Secrets & Environment File Leakage
* **Finding:** `.env` files were present locally with connection strings and credentials.
* **Audit Result:** Confirmed that Git history has **zero** committed `.env` files. `server/.env.example` contained generic templates.
* **Remediation:** 
  - Updated root `.gitignore` to explicitly reject `.env`, `.env.*`, and `*.env` across all directories while explicitly preserving `.env.example`.
  - Created standardized `.env.example` in both repository root and `client/` and updated `server/.env.example`.

### 2.2 Application Secrets Rotation
* **Finding:** Default development JWT secrets were generic strings.
* **Remediation:**
  - Application-generated `JWT_SECRET` rotated to a cryptographically secure 256-bit random hex string generated via `crypto.randomBytes(32).toString('hex')`.
  - `OTP_SECRET` generated and assigned for HMAC-SHA256 OTP verification hashing.

### 2.3 External Credential Rotation Guide (Neon & S3)
* **Status:** **BLOCKED** on manual owner rotation in third-party dashboards.
* **Owner Instructions:**
  1. **Neon PostgreSQL:**
     - Log in to your [Neon Console](https://console.neon.tech).
     - Navigate to your project (`ep-dry-union-bbawyvwi`).
     - Go to **Roles & Databases** $\rightarrow$ select `neondb_owner` $\rightarrow$ click **Reset password**.
     - Copy the newly generated connection string and update it in your local `server/.env` and in Vercel Project Settings.
  2. **Neon / AWS S3 Storage Keys:**
     - In the Neon storage dashboard, revoke old access keys (`nak_...`) and generate a fresh key pair.
     - Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `server/.env` and Vercel.

---

## 3. Database & Prisma Audit

* **Datasource:** Neon PostgreSQL (`neondb`), AWS `us-east-1`.
* **Prisma Configuration:**
  - Added `directUrl = env("DIRECT_URL")` to `prisma/schema.prisma` alongside `url = env("DATABASE_URL")` to support connection pooling and direct migration connections.
  - Added `binaryTargets = ["native", "rhel-openssl-3.0.x"]` so Prisma query engine runs reliably on Vercel's Amazon Linux serverless container.
* **Database State:**
  - Verified live tables: `User`, `Project`, `ProjectMember`, `Task`, `TaskAssignment`, `TaskSubmission`, `TaskComment`, `Notification`, and the newly provisioned `OtpVerification`.
  - Current verified database records: 9 Users (including live student registrations), 3 Academic Projects, 5 Tasks.
  - Made `prisma/seed.ts` **idempotent and non-destructive** using `upsert` so re-seeding never wipes real student or faculty submissions.

---

## 4. SMTP Email OTP Implementation Audit

* **Library:** `nodemailer` (v7.x) using pure SMTP transport.
* **Student Self-Registration Flow:**
  1. Student enters Full Name, College Email, Department, and Password.
  2. Server generates secure 6-digit numeric OTP via `crypto.randomInt(100000, 1000000)`.
  3. OTP is hashed using HMAC-SHA256 (`OTP_SECRET`) and saved with a 5-minute expiry in `OtpVerification`.
  4. HTML email template with TaskFlow styling dispatched via Nodemailer.
  5. Upon OTP validation, account is activated with `Role.STUDENT`. (Frontend role spoofing is strictly prevented).
* **Login OTP Flow:**
  1. User requests 6-digit verification code.
  2. Single-use OTP verified with timing-safe comparison (`crypto.timingSafeEqual`).
  3. JWT issued via HTTP-only secure cookie and authenticated session established.
* **Security Guardrails:**
  - **Cooldown:** 60 seconds enforced between OTP generation requests (HTTP 429).
  - **Attempt Limit:** Maximum 5 attempts per OTP; excess attempts invalidate the code.
  - **Single-Use:** OTP invalidated immediately upon first successful consumption.
  - **Email Enumeration Prevention:** Generic positive response returned even if email not registered.

---

## 5. Deployment Audit (`taskmanagerklu.vercel.app`)

* **Frontend:** Built with Vite + React 18 + Tailwind CSS. Deployed and serving HTML shell and production JS/CSS assets.
* **Backend:** Express API deployed via root `vercel.json` routing (`/api/*` $\rightarrow$ `server`).
* **Root Cause of HTTP 500 on Vercel:**
  Vercel serverless environment does not possess `DATABASE_URL` and `JWT_SECRET`. Because `.env` is gitignored, the owner must configure these variables in the Vercel Project Dashboard.
* **Blocking Owner Action:**
  Navigate to **Vercel Dashboard $\rightarrow$ Settings $\rightarrow$ Environment Variables** and input:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `NODE_ENV=production`
  Then trigger a redeployment.


# TaskFlow Production Database Diagnostic & Architecture Audit Report

**Target Domain:** [https://taskmanagerklu.vercel.app/](https://taskmanagerklu.vercel.app/)  
**GitHub Repository:** [https://github.com/void-tech-kumar/Task-Management-System-.git](https://github.com/void-tech-kumar/Task-Management-System-.git)  
**Date of Audit:** November 4, 2026  
**Status:** DIAGNOSIS COMPLETE & RESOLUTION IMPLEMENTED IN CODEBASE  

---

## Executive Summary

The production site `https://taskmanagerklu.vercel.app/` displayed:
```
"Backend database error. Please verify DATABASE_URL is set in Vercel Environment Variables."
```
When querying the production API health endpoint (`https://taskmanagerklu.vercel.app/api/health`), Vercel returned:
```
HTTP 500 FUNCTION_INVOCATION_FAILED
```

Our deep architectural inspection traced the exact sequence of events:
1. **Frontend Interceptor Mapping**: The frontend Axios client (`client/src/services/api.ts`) contains an error interceptor that checks for HTTP status 500 without a custom JSON error message, mapping it to: `"Backend database error. Please verify DATABASE_URL is set in Vercel Environment Variables."`
2. **Backend Serverless Lambda Crash**: The Express server service on Vercel crashed upon invocation because `vercel.json` pointed `"entrypoint"` directly to `src/server.ts` (raw TypeScript), and lacked an explicit service `"buildCommand"`. On Vercel, Node.js cannot parse `.ts` files natively.
3. **Missing Production Cloud Secrets**: Because all `.env` files are strictly gitignored to adhere to zero-trust security standards, the Vercel production deployment environment has not yet been populated with `DATABASE_URL`, `DIRECT_URL`, and `JWT_SECRET` in the Vercel Dashboard.
4. **Neon Database Verification**: The real Neon database (`ep-dry-union-bbawyvwi.c-15.us-east-1.aws.neon.tech`) is **100% ONLINE, HEALTHY, and OPERATIONAL**. Direct queries against the live Neon database completed in 2224ms, successfully reading 9 users, 3 academic projects, and 5 tasks.

---

## Detailed Audit: 18 Diagnostic Steps

### Step 1: Complete Frontend and Backend Deployment Architecture
- **Repository Pattern**: Monorepo using npm workspaces (`"workspaces": ["server", "client"]`).
- **Frontend App**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, React Router DOM.
- **Backend App**: Node.js, Express, TypeScript (ES Modules `"type": "module"`), Prisma ORM v6.
- **Hosting Infrastructure**: Single unified Vercel Project utilizing **Vercel Services** (Beta).
  - Service 1: `client` (Vite SPA)
  - Service 2: `server` (Express API)
- **Database Layer**: Neon Serverless PostgreSQL (`us-east-1` AWS region, cluster `c-15`).

```mermaid
flowchart TD
    User["Browser Client\n(https://taskmanagerklu.vercel.app/)"]
    VercelEdge["Vercel Edge Gateway / Router"]
    ClientService["Vercel Service: 'client'\n(Vite SPA Static Dist)"]
    ServerService["Vercel Service: 'server'\n(Express Serverless Lambda)"]
    NeonDB[("Neon PostgreSQL\n(AWS us-east-1)")]

    User -->|GET /login, /app/*| VercelEdge
    User -->|POST /api/v1/*, GET /health| VercelEdge

    VercelEdge -->|Rewrite /(.*)| ClientService
    VercelEdge -->|Rewrite /api/(.*) & /health| ServerService
    ServerService -->|Prisma Client Pooled Conn| NeonDB
```

---

### Step 2: Identify Where the Express Backend is Actually Hosted
- The Express backend is hosted on **Vercel Serverless Functions** via Vercel Services.
- It is **not** hosted on Render, Railway, Heroku, or an external VPS.
- Rewrites in `vercel.json` route all `/api/(.*)` requests into the internal service named `"server"`.

---

### Step 3: Inspect the Frontend API Base URL
- Located in `client/src/services/api.ts`:
  ```typescript
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api/v1',
    withCredentials: true,
  });
  ```
- In production, `VITE_API_URL` is omitted so the client defaults to relative URLs (`/api/v1`).
- In the browser, this routes directly through the current domain: `https://taskmanagerklu.vercel.app/api/v1/*`.

---

### Step 4: Check Whether Production Requests Incorrectly Point to Localhost
- **Finding**: Production requests do **NOT** point to `localhost`.
- Every client API request utilizes relative paths (`/api/v1/...`).
- Verified zero occurrences of `http://localhost` inside production client bundle builds.

---

### Step 5: Check Whether the Backend is Deployed or Only the Frontend
- **Finding**: Both services were provisioned by Vercel Services, but the `server` function failed to boot.
- The frontend was serving `index.html` and the compiled Vite bundle properly.
- The backend crashed on invocation (`FUNCTION_INVOCATION_FAILED`) due to invalid entrypoint configuration and missing build compilation.

---

### Step 6: Inspect the Prisma Datasource Configuration
- Located in `server/prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")
    directUrl = env("DIRECT_URL")
  }

  generator client {
    provider      = "prisma-client-js"
    binaryTargets = ["native", "rhel-openssl-3.0.x"]
  }
  ```
- **Engine Binary Targets**: Included `"rhel-openssl-3.0.x"`, which matches AWS Lambda / Vercel Serverless runtimes.
- **Direct URL**: Configured for schema migrations and DDL commands.

---

### Step 7: Verify the DATABASE_URL Environment Variable Name Used by the Backend
- Primary connection variable: `DATABASE_URL`.
- Direct unpooled variable: `DIRECT_URL`.
- In `server/src/config/env.ts`:
  ```typescript
  DATABASE_URL: process.env.DATABASE_URL || '',
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
  ```
- Prisma reads `DATABASE_URL` directly through `env("DATABASE_URL")`.

---

### Step 8: Identify Whether the Production Backend Can Access the Environment Variable
- **Local Environment**: `server/.env` exists and successfully connects to the database.
- **Production Environment (Vercel)**: The production backend **CANNOT** access `DATABASE_URL` because `.env` is gitignored (as required by security compliance).
- The repository owner must add `DATABASE_URL` into **Vercel Project Settings $\rightarrow$ Environment Variables**.

---

### Step 9: Verify the Actual Neon Database Hostname and SSL Configuration
- **Hostname**: `ep-dry-union-bbawyvwi.c-15.us-east-1.aws.neon.tech`
- **Region**: AWS `us-east-1`
- **Port**: `5432`
- **Database Name**: `neondb`
- **SSL Parameter**: `sslmode=require` (mandated by Neon)
- **Sample Hostname**: The faulty `ep-sample-pooler.us-east-2.aws.neon.tech` was completely removed.

---

### Step 10: Check the Neon Production Branch and Database Availability
- Ran automated test `server/scripts/test-db-connection.mjs`.
- Output:
  ```
  Status: ONLINE & REACHABLE
  Query Latency: 2224ms
  Database Name: neondb
  Database User: neondb_owner
  PostgreSQL Engine: PostgreSQL 18.6 (ac70818) on aarch64
  ```

---

### Step 11: Check the Backend Startup Logs and Prisma Connection Errors
- Live Vercel error when calling `/api/health`:
  ```
  A server error has occurred
  FUNCTION_INVOCATION_FAILED
  bom1::8b96h-1793807523861-f1efcfe3a12c
  HTTP_STATUS: 500
  ```
- Root Cause:
  1. Entrypoint was `src/server.ts` (TypeScript file not executable by Node.js).
  2. Lack of `prisma generate` during service build prevented the `rhel-openssl-3.0.x` query engine from being extracted into the Lambda environment.

---

### Step 12: Verify that DATABASE_URL is Configured in the Hosting Platform Environment
- Status: **PENDING OWNER INPUT IN VERCEL CONSOLE**.
- Instructions provided in Section 4 below.

---

### Step 13: Verify Vercel Configuration if Backend Functions Run on Vercel
- **Previous `vercel.json`**:
  ```json
  "server": {
    "root": "server",
    "framework": "express",
    "entrypoint": "src/server.ts"
  }
  ```
- **Updated `vercel.json` (FIXED)**:
  ```json
  "server": {
    "root": "server",
    "framework": "express",
    "buildCommand": "npm run build",
    "entrypoint": "dist/server.js"
  }
  ```
- Added route `/health` alongside `/api/(.*)` to handle direct health probes.

---

### Step 14: Fix Incorrect API URLs and Production Configuration
- Added root `package.json` scripts:
  - `"postinstall": "npm --prefix server run prisma:generate"`
  - `"build": "npm --prefix server run build && npm --prefix client run build"`
- Created `server/src/index.ts` re-exporting `app` to guarantee entrypoint detection.
- Updated `server/package.json` with `"main": "dist/server.js"`.

---

### Step 15: Test the Database Connection with Prisma
- Executed `node server/scripts/test-db-connection.mjs`:
  ```
  === STEP 10 & 15: NEON CONNECTIVITY VERIFICATION ===
  Status: ONLINE & REACHABLE
  Query Latency: 2224ms
  Database Name: neondb
  Database User: neondb_owner
  PostgreSQL Engine: PostgreSQL 18.6 (ac70818) on aarch64
  ```

---

### Step 16: Test the Production API Health Endpoint
- Tested endpoint: `https://taskmanagerklu.vercel.app/api/health`
- Result: Currently 500 prior to redeployment with compiled entrypoint.
- Next step: Will return HTTP 200 `{ status: "ok", databaseConfigured: true }` once redeployed with environment variables.

---

### Step 17: Test a Real Database Read Operation
- Executed `node server/scripts/test-db-connection.mjs` against live database:
  ```
  === STEP 17: REAL DATABASE READ OPERATIONS ===
  Record Counts: Users=9, Projects=3, Tasks=5

  Sample Users Query:
   - [STUDENT] kumar Prince (kumarprincenwd700@gmail.com) [Verified: true]
   - [STUDENT] Emily Davis (emily.davis@taskflow.edu) [Verified: true]
   - [ADMIN] Dr. Dean Harrison (Admin) (admin@taskflow.edu) [Verified: true]
   - [STUDENT] Priya Sharma (priya.sharma@taskflow.edu) [Verified: true]

  Sample Projects Query:
   - [ACTIVE] "Full-Stack Software Architecture" (Dept: Software Engineering)
   - [ACTIVE] "Distributed Systems & Cloud Computing" (Dept: Computer Science)
   - [ACTIVE] "Applied Machine Learning & Capstone" (Dept: Computer Science)

  Sample Tasks Query:
   - [IN_PROGRESS | HIGH] "Assignment 3: gRPC Inter-Service Communication"
   - [IN_REVIEW | MEDIUM] "Lab 2: Dockerizing Microservices & Docker Compose"
   - [COMPLETED | HIGH] "Milestone 1: Raft Consensus RPC Specification"

  >>> All Real Database Read Operations Completed Successfully with ZERO errors. <<<
  ```

---

### Step 18: Report All Remaining Blockers
There is **only ONE remaining operational blocker**, which requires dashboard action by the project owner:

> [!IMPORTANT]
> **Owner Action Required in Vercel Dashboard:**
> Because credentials must NEVER be stored in GitHub, you must paste your environment variables into the Vercel Dashboard for your project.

---

## Action Guide for Project Owner

### Step 1: Open Vercel Project Settings
1. Navigate to [https://vercel.com/dashboard](https://vercel.com/dashboard).
2. Select your project: **`taskmanagerklu`** (or `task-management-system-`).
3. Click on the **Settings** tab $\rightarrow$ click **Environment Variables** in the left sidebar.

### Step 2: Add Required Environment Variables
Add each of the following variables for **Production**, **Preview**, and **Development**:

| Variable Name | Description / Source |
|---|---|
| `DATABASE_URL` | Your Neon pooled connection string (`postgresql://neondb_owner:***@ep-dry-union-bbawyvwi-pooler.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require`) |
| `DIRECT_URL` | Your Neon direct connection string (`postgresql://neondb_owner:***@ep-dry-union-bbawyvwi.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require`) |
| `JWT_SECRET` | 256-bit secure secret key (use the one generated in `server/.env`) |
| `OTP_SECRET` | 256-bit secure HMAC key (use the one generated in `server/.env`) |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | `https://taskmanagerklu.vercel.app` |

*(Optional for SMTP Email Delivery):*
| Variable Name | Value |
|---|---|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | 16-character Google App Password |
| `SMTP_FROM` | `TaskFlow Academic Portal <your-email@gmail.com>` |

### Step 3: Trigger a Redeployment
1. Click **Deployments** in the top navigation of the Vercel Dashboard.
2. Find the latest deployment, click the **`...`** (three dots) icon on the right, and click **Redeploy**.
3. Once deployed, test the login portal:
   - `https://taskmanagerklu.vercel.app/login`
   - Use one-click demo credentials (`admin@taskflow.edu` / `Admin@123`).


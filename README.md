# CampusConnect — Campus Lost & Found Management Platform

CampusConnect is a modern, production-grade university lost-and-found management portal designed to streamline the reporting, tracking, verification, and reunification of lost personal belongings across university grounds.

Built with a clean university-grade design system, relational data persistence via **Prisma ORM**, a **Node.js/Express REST API**, a standalone **Notification Microservice**, an intelligent **Lost & Found Matching Engine**, and full **HTML5 Camera Capture & Photo Gallery Uploads**.

---

## 1. System Architecture Overview

CampusConnect follows a clean, modular multi-tier architecture:

```
campus-lost-found/
├── frontend/                 # React 18 + Vite + TypeScript + Tailwind CSS (Port 5173)
├── backend/                  # Express REST API + TypeScript + Prisma ORM (Port 5000)
│   ├── prisma/               # Schema, migrations, and realistic synthetic seed dataset
│   ├── src/                  # Controllers, services, domain logic, middleware, routes
│   └── tests/                # Automated API & business rule test suite (Vitest + Supertest)
├── notification-service/     # Standalone Express Notification Microservice (Port 5001)
│   ├── src/                  # Notification dispatcher & email service (Nodemailer)
│   └── tests/                # Microservice health & dispatch tests
├── README.md                 # System documentation & setup guide
├── .env.example              # Environment variables template
└── package.json              # Root project orchestrator scripts
```

### Architectural Boundaries & Service Communication
- **Frontend ↔ Backend**: Secure REST API over JSON with JWT Bearer authentication. Proxied via Vite dev server.
- **Backend ↔ Database**: Relational persistence using Prisma ORM. Compatible out-of-the-box with SQLite (`dev.db`) for immediate zero-dependency evaluation, and PostgreSQL (`schema.postgresql.prisma`) for enterprise deployment.
- **Backend ↔ Notification Microservice**: HTTP REST dispatch boundary (`POST http://localhost:5001/api/notifications/send`). The main backend persists notifications directly in the database and asynchronously delegates dispatch/email generation to the isolated microservice.
- **Microservice ↔ External SMTP**: Sends formatted HTML emails via Nodemailer when SMTP environment variables are present; gracefully logs delivery when unconfigured while keeping in-app notifications intact.

---

## 2. Key Features

### 🎓 Student Features
- **Lost Item Reporting**: Detailed form including approximate location, category, date, brand, color, distinguishing characteristics, and contact preferences.
- **Found Property Registration**: Separate **Public Description** (browsable by all students) and **Private Verification Details** (strictly confidential, visible only to finder and campus administrators).
- **Direct Camera Capture & Photo Gallery**:
  - Live HTML5 camera capture via `navigator.mediaDevices.getUserMedia` with video canvas snapshot.
  - Device photo gallery / computer file upload.
  - Supports up to 5 photographs per listing with preview, deletion, and primary cover selection.
- **Marketplace Browsing & Search**:
  - Full-text search across item name, description, brand, color, and campus location.
  - Filters by Type (`LOST` / `FOUND`), Category, Campus Location, and Status.
  - Sort by newest or oldest, with pagination.
- **Intelligent Algorithm Matching Engine**:
  - When reporting or viewing lost items, an algorithmic engine calculates match confidence percentages (0–100%) against existing found items using category alignment, keyword overlap, color, location proximity, and timeline closeness.
- **Ownership Claim Workflow**:
  - Students submit structured claims explaining proof of ownership and identifying marks.
  - Prevents claiming one's own found items.
  - Prevents duplicate active claims on the same item.
- **Pickup & Collection Tracking**:
  - Tracks status: `Scheduled`, `Ready for Pickup`, and `Collected`.
  - Details collection counter location, date/time, and verification instructions.
- **Student Dashboard**:
  - Live counts of reported items, active claims, and reunited items.
  - Management of personal listings (status transitions, deletion, viewing received claims).
  - Notifications inbox with real-time unread badges.

### 🛡️ Administration Features
- **Administrative Dashboard Overview**: Real-time aggregated database statistics for registered students, missing items, turned-in items, and recovery rates.
- **Category & Location Analytics**: Visual distribution of reported items across campus locations and categories.
- **Item Listings Oversight**: Ability to inspect confidential private verification notes for any item, moderate content, change lifecycle statuses, and delete inappropriate listings.
- **Claims Management**: Centralised review of ownership claims with access to claimant university details and supporting evidence.
- **User Account Management**: Search students by Student ID, name, or department, with instant account suspension and reactivation controls.
- **Audit Logging**: Comprehensive audit trail of actions (`ITEM_CREATED`, `CLAIM_APPROVED`, `COLLECTION_CONFIRMED`, `USER_SUSPENDED`).

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, Vite, TypeScript |
| **Styling & Icons** | Tailwind CSS, Lucide React |
| **Routing & Forms** | React Router 7, React Hook Form, Zod |
| **API Client** | Axios (configured with JWT interceptors) |
| **Backend Framework** | Node.js, Express.js, TypeScript |
| **Security & Auth** | JWT (jsonwebtoken), bcryptjs, Helmet, CORS |
| **Database & ORM** | PostgreSQL / SQLite, Prisma ORM 5.22 |
| **File Storage** | Multer disk storage (served statically at `/uploads`) |
| **Notification Microservice** | Node.js, Express, Nodemailer, Zod |
| **Testing** | Vitest, Supertest |

---

## 4. Database Schema & Entities

The relational schema implements proper foreign keys, unique constraints, and indexes:

- **User**: `id`, `fullName`, `email` (unique), `studentId` (unique), `passwordHash`, `department`, `yearOfStudy`, `role` (`STUDENT` | `ADMIN`), `accountStatus` (`ACTIVE` | `SUSPENDED`).
- **Category**: `id`, `name` (unique), `description`, `icon`.
- **Item**: `id`, `referenceNumber` (unique), `reporterId` (FK User), `categoryId` (FK Category), `itemType` (`LOST` | `FOUND`), `publicDescription`, `privateVerificationDetails` (confidential), `location`, `dateOccurred`, `colour`, `brand`, `distinguishingFeatures`, `currentHoldingLocation`, `status`, `createdAt`.
- **ItemImage**: `id`, `itemId` (FK Item, cascade), `imageUrl`, `isPrimary`, `createdAt`.
- **Claim**: `id`, `referenceNumber` (unique), `itemId` (FK Item), `claimantId` (FK User), `claimDescription`, `identifyingCharacteristics`, `supportingEvidence`, `status` (`PENDING` | `UNDER_REVIEW` | `APPROVED` | `REJECTED`), `rejectionReason`, `verificationNotes`.
- **Collection**: `id`, `claimId` (FK Claim, 1-to-1), `collectionLocation`, `collectionInstructions`, `scheduledAt`, `collectedAt`, `confirmedById` (FK User), `status` (`SCHEDULED` | `COLLECTED`), `handoverNotes`.
- **Notification**: `id`, `userId` (FK User), `title`, `message`, `type`, `link`, `isRead`, `createdAt`.
- **AuditLog**: `id`, `actorId` (FK User), `action`, `entityType`, `entityId`, `details`, `createdAt`.

---

## 5. Prerequisites

- **Node.js**: v18.0.0 or newer (Tested on Node.js v24)
- **npm** or **pnpm** package manager
- **PostgreSQL** (optional for production; SQLite is configured out-of-the-box for instant local setup)

---

## 6. Installation & Quick Start

### Step 1: Clone or Navigate to the Project
```bash
cd "FULL STACK TASK 4"
```

### Step 2: Database Initialization & Seeding
The database is pre-configured with SQLite (`dev.db`) for zero-friction setup. Run the following commands to generate Prisma Client and populate the database with realistic synthetic campus data:

```bash
# Generate Prisma Client
npm --prefix backend run prisma:generate

# Push database schema (creates dev.db)
npm --prefix backend run prisma:push

# Seed database with realistic accounts, items, claims & collections
npm --prefix backend run db:seed
```

> **Using PostgreSQL?**
> If you have a PostgreSQL server running, update `backend/.env` with your connection string:
> `DATABASE_URL="postgresql://postgres:password@localhost:5432/campus_lost_found?schema=public"`
> Copy `backend/prisma/schema.postgresql.prisma` to `backend/prisma/schema.prisma` and run `npm --prefix backend run prisma:push`.

---

## 7. Running the Application

To run all three services, open three separate terminal windows:

### Terminal 1: Notification Microservice (Port 5001)
```bash
npm --prefix notification-service run dev
```
*Health check:* `http://localhost:5001/api/notifications/health`

### Terminal 2: Main Backend API (Port 5000)
```bash
npm --prefix backend run dev
```
*Health check:* `http://localhost:5000/api/health`

### Terminal 3: React Frontend (Port 5173)
```bash
npm --prefix frontend run dev
```
*Application URL:* `http://localhost:5173`

---

## 8. Demo Login Credentials

The database seed script generates realistic university accounts for testing and demonstration:

| Role | Name | University Email | Password | Student ID |
|---|---|---|---|---|
| **Administrator** | Dean Michael Vance | `admin@campusconnect.edu` | `Admin@12345` | `ADM-9001` |
| **Student (CS Year 3)** | Sarah Chen | `sarah.chen@campusconnect.edu` | `Student@12345` | `STU-2023-4412` |
| **Student (MechEng Year 2)** | Marcus Johnson | `marcus.johnson@campusconnect.edu` | `Student@12345` | `STU-2024-8891` |
| **Student (Business Year 4)** | Priya Sharma | `priya.sharma@campusconnect.edu` | `Student@12345` | `STU-2022-1054` |
| **Student (EE Year 1)** | David Kim | `david.kim@campusconnect.edu` | `Student@12345` | `STU-2025-3319` |

> 💡 **Quick Login Tip**: The login page (`/login`) includes **1-Click Demo Buttons** for instant evaluation without typing credentials.

---

## 9. Automated Test Results

The project includes unit and integration tests using **Vitest** and **Supertest**.

### Running Tests
```bash
# Run notification microservice tests
npm --prefix notification-service test

# Run backend API & business logic integration tests
npm --prefix backend test
```

### Verified Business Rules in Backend Test Suite:
1. `POST /api/items`: Successful item creation with formatted reference number (`LF-2026-XXXX`).
2. `POST /api/items`: Fails item creation when required fields are missing (server Zod validation).
3. `GET /api/items/:id`: **Confidential Private Verification Details are NOT leaked** to unauthorized students or public APIs.
4. `POST /api/claims`: Prevents students from submitting ownership claims on items they reported found themselves.
5. `POST /api/claims`: Successfully accepts legitimate claim from other students.
6. `POST /api/claims`: **Prevents duplicate active claims** from the same user for the same item.
7. `PATCH /api/claims/:id/review`: **Rejects claim review when status is REJECTED without a rejection reason**.
8. `PATCH /api/claims/:id/review`: Successfully approves claim and transitions item status to `CLAIM_APPROVED`.
9. `PATCH /api/items/:id/status`: Enforces valid lifecycle status transitions and rejects invalid states.
10. `GET /api/admin/dashboard`: **Prevents unauthorized students from accessing protected admin endpoints** (HTTP 403 Forbidden).
11. `POST /api/collections/schedule`: Successfully schedules item collection handover with location and instructions.
12. `PATCH /api/collections/:id/confirm`: Confirms item collection handover, records confirmedBy timestamp, and transitions item to `RETURNED`.
13. `GET /api/admin/dashboard`: Admin dashboard aggregates real database counts and metrics.

---

## 10. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student account with duplicate email/student ID protection.
- `POST /api/auth/login` — Login with university email and password, returning JWT token.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `POST /api/auth/logout` — Invalidate session.

### Items (`/api/items`)
- `GET /api/items` — Query items with search, filters (type, category, location, status), sort, and pagination.
- `GET /api/items/categories` — List all campus property categories.
- `GET /api/items/:id` — Retrieve item details, similar category items, and smart matching candidates.
- `POST /api/items` — Report lost/found item with multipart image upload (up to 5 photos).
- `PUT /api/items/:id` — Update listing details (Reporter/Admin only).
- `DELETE /api/items/:id` — Delete listing and associated media (Reporter/Admin only).
- `PATCH /api/items/:id/status` — Enforce valid status transition.
- `POST /api/items/upload` — Dedicated multipart image upload endpoint.

### Claims (`/api/claims`)
- `POST /api/claims` — Submit ownership claim with proof and identifying marks.
- `GET /api/claims` — Retrieve claims (filtered for students or all for admins).
- `GET /api/claims/:id` — Retrieve claim details, claimant info, and verification notes.
- `PATCH /api/claims/:id/review` — Approve, decline (requires reason), or request more info.

### Collections (`/api/collections`)
- `POST /api/collections/schedule` — Schedule pickup location and instructions.
- `PATCH /api/collections/:id/confirm` — Confirm physical handover and mark item as `RETURNED`.
- `GET /api/collections/:id` — View collection record.

### Administration (`/api/admin`)
- `GET /api/admin/dashboard` — Platform overview metrics and category/location distributions.
- `GET /api/admin/users` — Search and paginate registered university users.
- `PATCH /api/admin/users/:id/status` — Suspend or reactivate user account.
- `GET /api/admin/items` — Audit all listings including private verification notes.
- `GET /api/admin/claims` — Full claims oversight.

---

## 11. Production Build Commands

```bash
# Build backend to dist/
npm --prefix backend run build

# Build notification microservice to dist/
npm --prefix notification-service run build

# Build frontend to dist/
npm --prefix frontend run build
```

---

## 12. Troubleshooting

1. **Port in use error (EADDRINUSE)**: Ensure ports 5000, 5001, and 5173 are not occupied. You can configure custom ports via the `.env` files in each service directory.
2. **Prisma Client not found**: Run `npm --prefix backend run prisma:generate`.
3. **Database tables empty**: Run `npm --prefix backend run db:seed` to repopulate the sample records.
4. **Camera permission issue**: Ensure browser permissions for camera access are allowed, or use the file upload selector to choose images directly from your disk.

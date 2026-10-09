```markdown
# HABITATX — Architectural Living & Real-Time Booking Platform

<p align="center">
  <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" alt="HabitatX Banner" width="100%" />
</p>

<p align="center">
  <b>A full-stack, distributed spatial living platform connecting tenants, landlords, and platform curators for spatial discovery, real-time reservations, and automated escrow settlement.</b>
</p>

<p align="center">
  <a href="#core-architectural-highlights">Architecture</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#role-based-access-control-rbac">RBAC Roles</a> •
  <a href="#key-system-features">Features</a> •
  <a href="#system-architecture--event-flow">Data Flow</a> •
  <a href="#getting-started">Setup Guide</a> •
  <a href="#api-reference-overview">API Reference</a>
</p>

---

## 🌟 Core Architectural Highlights

- **Decoupled Cloud Architecture:** Deployed across environments with the React/Vite SPA hosted on **Vercel** and the containerized Node.js/Express WebSocket backend hosted on **Railway**[cite: 1, 9].
- **Bidirectional WebSocket Engine:** Event-driven synchronization powered by **Socket.IO** combined with **TanStack React Query** cache invalidation to provide instant status and badge updates across clients without page reloads[cite: 16].
- **Zero-Trust Cross-Domain Session Security:** Strict CORS whitelist isolation paired with authenticated cross-origin `httpOnly` JWT sessions configured with `SameSite=None` and `Secure` attributes[cite: 9, 17].
- **Integrated Payment Gateway:** Escrow transaction processing managed through **Safepay Checkout**, featuring transaction logging, fallback handling, and optimistic client cache updates[cite: 15, 19].

---

## 🛠 Technology Stack

### Frontend Core
- **Framework & Build Tool:** React 18, Vite[cite: 17]
- **Styling:** Tailwind CSS (Custom Dark Architectural Theme)[cite: 16]
- **Server Cache & State:** TanStack Query (React Query v5), Zustand (`useAuthStore`)[cite: 16]
- **Real-Time Client:** Socket.IO Client (`socket.io-client`)[cite: 16]
- **HTTP Client:** Axios (Configured with `withCredentials: true` and interceptors)[cite: 16]
- **Routing & Visuals:** React Router DOM v6, Lucide React[cite: 16]

### Backend Micro-Engine
- **Runtime & Framework:** Node.js, Express.js (ES Modules)[cite: 17]
- **WebSocket Gateway:** Socket.IO Server[cite: 17]
- **Authentication & Parsing:** Cookie-Parser, JSON Web Tokens (JWT)[cite: 17]
- **CORS Handling:** Express CORS Middleware with strict origin whitelisting[cite: 9, 17]

### Data & Cloud Infrastructure
- **Database & ODM:** MongoDB Atlas, Mongoose[cite: 17]
- **Media Pipeline:** Cloudinary Cloud Storage SDK
- **Identity & Governance:** Firebase Admin SDK & Firebase Client SDK[cite: 6, 8]
- **Payment Processing:** Safepay REST API & Sandbox Checkout SDK[cite: 15]
- **Deployment:** Vercel (Frontend Client)[cite: 1, 9], Railway (Backend Containers)[cite: 9]

---

## 👥 Role-Based Access Control (RBAC)

HabitatX enforces strict authorization boundaries across four user tiers[cite: 16]:

| Role | Permissions & Workspace Scope |
| :--- | :--- |
| **Tenant** | Browse spaces, date-conflict validation, submit booking requests, manage Curated Vault (Wishlist), checkout via Safepay, access printable E-Receipts, and submit architectural reviews[cite: 14, 15, 17]. |
| **Landlord / Host** | Dedicated Host Workspace, publish properties via Cloudinary media uploads, review incoming requests, approve/reject reservations, and cancel confirmed stays[cite: 16, 17, 18]. |
| **Admin** | Workspace oversight, audit platform reservations, inspect transaction ledgers, and manage property statuses[cite: 16, 17, 18]. |
| **SuperAdmin** | Complete platform oversight, platform-wide reservation tracking, user role management, and system-wide overrides[cite: 16, 17]. |

---

## 🚀 Key System Features

### 1. Real-Time Reservation Lifecycle
- Property-specific date conflict detection prevents overlapping bookings for reserved dates[cite: 17].
- Managed escrow flow transitions: `pending` $\rightarrow$ `approved` $\rightarrow$ `confirmed` (with options for `rejected` or `cancelled`)[cite: 17].
- Server-side WebSocket broadcasts notify participating parties when status changes or cancellations occur[cite: 17, 19].

### 2. Instant Actionable Badge Tracking
- Top navigation displays dynamic counters for actionable items[cite: 16].
- Tenants see their active stays; Hosts see incoming requests needing review[cite: 16, 17].
- Badge numbers sync live across clients via Socket.IO events (`booking_created`, `booking_status_updated`, `booking_deleted`)[cite: 16, 18].

### 3. Safepay Escrow Integration & E-Receipts
- Popup checkout flow handles card and mobile wallet transactions[cite: 14, 15].
- Optimistic cache updates confirm the reservation the moment the checkout window closes[cite: 19].
- Generates an architectural habitation receipt with print styling (`@media print`) and PDF export support[cite: 14, 19].

### 4. Curated Vault & Architectural Review System
- Save listings directly to a personal wishlist ("Vault")[cite: 16].
- Review submission system covering ratings and qualitative feedback regarding structure, lighting, and amenities[cite: 14, 17].

---

## 📐 System Architecture & Event Flow

```text
       [ React / Vite Client ]  (Vercel SPA)
             |             \
             | HTTPS        \ WSS (WebSockets)
             v               v
  [ Express.js REST API ] <---> [ Socket.IO Server ]  (Railway Container)
         |            |                |
         | Mongoose   | HTTPS          | Broadcast Events
         v            v                v
   [ MongoDB ]   [ Cloudinary ]   [ Active Clients ]
   (Atlas Cl.)   (Media Assets)   (Tenant / Host Navbar)

```

---

## 💻 Getting Started

### Prerequisites

* Node.js (v18.0.0 or higher)
* MongoDB Database URI (Atlas or local instance)
* Cloudinary, Safepay, and Firebase API credentials

### 1. Clone the Repository

```bash
git clone [https://github.com/](https://github.com/)<your-username>/habitatx.git
cd habitatx

```

### 2. Backend Setup

```bash
cd backend
npm install

```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=[https://habitatx-nine.vercel.app](https://habitatx-nine.vercel.app)

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Safepay
SAFEPAY_API_KEY=your_safepay_secret_key
SAFEPAY_ENV=sandbox

```

Start the backend server:

```bash
npm run dev

```

### 3. Frontend Setup

```bash
cd ../client
npm install

```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=[https://habitatx-production.up.railway.app/api](https://habitatx-production.up.railway.app/api)
VITE_SOCKET_URL=[https://habitatx-production.up.railway.app](https://habitatx-production.up.railway.app)

```

Start the client development server:

```bash
npm run dev

```

---

## 📡 API Reference Overview

### Authentication (`/api/auth`)

* `POST /api/auth/register` — Register a new user account.
* `POST /api/auth/login` — Authenticate and issue an HTTP-only JWT cookie.
* `POST /api/auth/logout` — Invalidate session and clear cross-site cookie credentials.

### Properties & Listings (`/api/listings`)

* `GET /api/listings` — Retrieve listings with search and filter parameters.
* `POST /api/listings` — Create a new property listing (Landlords/Admins only).
* `GET /api/listings/:id` — Fetch listing details, amenities, and host profile.

### Reservations & Escrow (`/api/bookings`)

* `GET /api/bookings/badge-count` — Real-time count of actionable reservation requests.


* `POST /api/bookings` — Submit a reservation request (Validates date availability).


* `PATCH /api/bookings/:id/status` — Approve, reject, or cancel a reservation.


* `POST /api/bookings/:id/checkout` — Generate a Safepay checkout session.


* `POST /api/bookings/:id/finalize-payment` — Confirm transaction settlement and update status to confirmed.



---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

```

```

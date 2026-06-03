# SubTracker

A REST API for tracking personal subscriptions with JWT authentication, MongoDB persistence, and automated renewal reminder emails powered by Upstash Workflow and QStash.

## Features

- **User authentication** — sign up and sign in with JWT (Bearer token)
- **Subscription management** — create and retrieve subscriptions with validation
- **Automated reminders** — durable workflows send email reminders 7, 5, 2, and 1 day(s) before renewal
- **Security** — Arcjet middleware for bot detection, rate limiting, and shield protection
- **Email notifications** — HTML reminder emails via Nodemailer (Gmail)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES modules) |
| Framework | Express 4 |
| Database | MongoDB + Mongoose 9 |
| Auth | JWT + bcryptjs |
| Workflows | Upstash Workflow + QStash |
| Email | Nodemailer |
| Security | Arcjet |

## Prerequisites

- Node.js 18+
- MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Upstash](https://console.upstash.com/) account (or local QStash dev server)
- [Arcjet](https://arcjet.com/) API key
- Gmail account with an [App Password](https://support.google.com/accounts/answer/185833) for Nodemailer

## Getting Started

### 1. Clone and install

```bash
git clone <repository-url>
cd subscription-tracker
npm install
```

### 2. Environment variables

Create a `.env.development.local` file in the project root (this file is gitignored):

```env
# Server
PORT=5500
SERVER_URL=http://localhost:5500

# Environment
NODE_ENV=development

# Database
DB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d

# Arcjet
ARCJET_KEY=your-arcjet-key

# Upstash QStash (local dev defaults shown below)
QSTASH_URL=http://127.0.0.1:8080
QSTASH_TOKEN=eyJVc2VySUQiOiJkZWZhdWx0VXNlciIsIlBhc3N3b3JkIjoiZGVmYXVsdFBhc3N3b3JkIn0=

# Nodemailer (Gmail App Password)
EMAIL_PASSWORD=your-gmail-app-password
```

For production, create `.env.production.local` with the same keys and use your production values (including `QSTASH_URL=https://qstash.upstash.io` and a real QStash token from the Upstash console).

Update the sender address in `config/nodemailer.js` to match your Gmail account.

### 3. Start the local QStash dev server

Workflow reminders depend on QStash. For local development, run the dev server in a **separate terminal**:

```bash
npx @upstash/qstash-cli dev
```

This listens on `http://127.0.0.1:8080` by default, matching the local `QSTASH_URL` above.

### 4. Start the API

```bash
npm run dev
```

The server starts at `http://localhost:5500` (or your configured `PORT`).

## API Reference

All routes are prefixed with `/api/v1`. Protected routes require a Bearer token:

```
Authorization: Bearer <jwt-token>
```

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/sign-up` | No | Register a new user |
| `POST` | `/auth/sign-in` | No | Sign in and receive a JWT |
| `POST` | `/auth/sign-out` | No | Sign out *(not yet implemented)* |

**Sign up / sign in body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword"
}
```

### Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/users` | No | List all users |
| `GET` | `/users/:id` | Yes | Get user by ID |
| `POST` | `/users` | No | *(placeholder)* |
| `PUT` | `/users/:id` | No | *(placeholder)* |
| `DELETE` | `/users/:id` | No | *(placeholder)* |

### Subscriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/subscriptions` | No | List all subscriptions |
| `GET` | `/subscriptions/:id` | No | Get subscription by ID |
| `POST` | `/subscriptions` | Yes | Create subscription and trigger reminder workflow |
| `GET` | `/subscriptions/user/:id` | Yes | Get subscriptions for a user (must match token) |
| `PUT` | `/subscriptions/:id` | No | *(placeholder)* |
| `DELETE` | `/subscriptions/:id` | No | *(placeholder)* |
| `PUT` | `/subscriptions/:id/cancel` | No | *(placeholder)* |
| `GET` | `/subscriptions/upcoming-renewals` | No | *(placeholder)* |

**Create subscription body:**

```json
{
  "name": "Netflix",
  "price": 149,
  "currency": "SEK",
  "frequency": "monthly",
  "category": "Entertainment",
  "paymentMethod": "Credit Card",
  "startDate": "2026-05-28"
}
```

Optional: `renewalDate` — if omitted, it is calculated from `startDate` + frequency (7 / 30 / 365 days).

**Field constraints:**

| Field | Values |
|-------|--------|
| `currency` | `USD`, `EUR`, `SEK`, `GBP` |
| `frequency` | `weekly`, `monthly`, `yearly` |
| `category` | `sport`, `Entertainment`, `Productivity`, `Education`, `Health`, `Other` |
| `paymentMethod` | `Credit Card`, `PayPal`, `Bank Transfer`, `Swish`, `Klarna`, `Other` |
| `status` | `active`, `cancelled`, `expired` (auto-set if renewal date has passed) |
| `startDate` | Must not be in the future |

**Successful create response:**

```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "subscription": { "...": "..." },
    "workflowRunId": "wfr_..."
  }
}
```

### Workflows

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/workflows/subscription/reminder` | No | Upstash webhook — do not call manually |

This endpoint is invoked by QStash when a subscription is created. It schedules and sends reminder emails to the user's registered email address.

## How Reminders Work

1. A subscription is created via `POST /api/v1/subscriptions`.
2. The API triggers an Upstash Workflow via QStash.
3. QStash calls back to `POST /api/v1/workflows/subscription/reminder`.
4. The workflow loads the subscription, checks that it is still `active`, and schedules reminders at:
   - 7 days before renewal
   - 5 days before renewal
   - 2 days before renewal
   - 1 day before renewal
5. At each scheduled date, an HTML email is sent to the user's email via Nodemailer.

Reminders are **not sent immediately** on creation — they fire on the calculated reminder dates. To test a reminder on the same day, set `renewalDate` so that `renewalDate − X days` equals today (e.g. for a 7-day reminder today, set `renewalDate` to 7 days from now).

## Project Structure

```
subscription-tracker/
├── app.js                      # Express app entry point
├── config/
│   ├── arcjet.js               # Arcjet security rules
│   ├── env.js                  # Environment variable loader
│   ├── nodemailer.js           # Email transporter
│   └── upstash.js              # Upstash Workflow client
├── controllers/
│   ├── auth.controller.js
│   ├── subscription.controller.js
│   ├── user.controller.js
│   └── workflow.controller.js  # Reminder workflow handler
├── database/
│   └── mongodb.js
├── middlewares/
│   ├── arcjet.middleware.js
│   ├── auth.middleware.js
│   └── error.middleware.js
├── models/
│   ├── subscription.model.js
│   └── user.model.js
├── routes/
│   ├── auth.routes.js
│   ├── subscription.routes.js
│   ├── user.routes.js
│   └── workflow.routes.js
└── utils/
    ├── email-template.js
    └── send-email.js
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with nodemon (hot reload) |
| `npm start` | Start in production mode |

## Troubleshooting

| Issue | Likely cause | Fix |
|-------|--------------|-----|
| `ECONNREFUSED 127.0.0.1:8080` | QStash dev server not running | Run `npx @upstash/qstash-cli dev` |
| `workflowRunId` returned but no email | Reminder date is in the future | Set `renewalDate` for a near-term test (see above) |
| Workflow never runs | Wrong `SERVER_URL` in trigger | Must match your app URL, e.g. `http://localhost:5500/api/v1/workflows/subscription/reminder` |
| `403 Bot detected` on workflow | Arcjet blocking QStash webhooks | Exclude workflow routes from Arcjet bot detection |
| Gmail send fails | Invalid app password | Use a Gmail App Password, not your regular password |
| Validation errors on create | Wrong enum values or date format | Match exact category/currency values; use ISO dates like `2026-05-28` |

## License

Private — not for public distribution.

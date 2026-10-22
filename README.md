# Milo & Tails

**Smart Pet Care & Service Management Platform** — a full-stack MERN application.

Milo & Tails gives a pet owner one place for their pets' health records, care reminders, collar tag and service bookings; gives vets and service providers a way to publish services and manage bookings; and gives an administrator control over who is verified to take those bookings.

---

## The three headline features

**1. Smart Pet Health Passport**
Every pet has one digital passport holding vaccinations (with next due dates), allergies, current medications, medical conditions, vet visits, treatment notes and uploaded reports or prescriptions.

**2. Pet Growth & Health Dashboard**
Current weight, weight history as a line chart, vaccination status, upcoming vaccinations, active medication, upcoming appointments and recent health activity — read at a glance and colour-coded.

**3. QR Pet Identity + Location Alert**
Every pet gets a unique QR code the owner can print for the collar. Scanning it opens a public page showing only what the owner chose to share. A finder can press **Share found location**; the browser asks for permission, and only if it is granted are the coordinates captured, saved against that pet, and pushed to the owner as a notification with a map link. There is no continuous tracking — location is recorded once, on an explicit action.

---

## Tech stack

| Layer | Choice |
|---|---|
| Database | MongoDB + Mongoose |
| Backend | Node.js + Express |
| Frontend | React 18 + Vite + React Router |
| Auth | JWT (`jsonwebtoken`) with role-based authorization |
| Passwords | bcrypt (`bcryptjs`) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| QR codes | `qrcode` |
| Uploads | Multer (pet photos, medical documents) |
| Location | Browser Geolocation API |

---

## Running it

**Prerequisites:** Node.js 18+, and MongoDB running locally (or a MongoDB Atlas connection string).

```bash
# 1. Install both apps
npm run install:all          # or: cd server && npm i   then   cd client && npm i

# 2. Configure the backend
cd server
cp .env.example .env         # then edit .env and set a real JWT_SECRET

# 3. Load demo data (optional but recommended — this clears the database)
npm run seed

# 4. Start the API   (terminal 1)
npm run dev                  # http://localhost:5000

# 5. Start the app   (terminal 2)
cd ../client
npm run dev                  # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to port 5000, so no frontend configuration is needed.

### Environment variables (`server/.env`)

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/milo_and_tails
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173      # used to build the QR tag link
SERVER_URL=http://localhost:5000
```

### Demo accounts (after `npm run seed`)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@miloandtails.com` | `admin123` |
| Pet owner | `priya@example.com` | `owner123` |
| Pet owner | `arjun@example.com` | `owner123` |
| Provider — vet, verified | `vet@example.com` | `provider123` |
| Provider — grooming, verified | `groomer@example.com` | `provider123` |
| Provider — boarding, verified | `boarding@example.com` | `provider123` |
| Provider — sitting, **pending** | `sitter@example.com` | `provider123` |

The pending provider is there so the admin verification flow can be demonstrated.

---

## Project structure

```
milo-and-tails/
├── server/
│   ├── uploads/                    # pet photos, reports, prescriptions
│   └── src/
│       ├── server.js               # express app + route mounting
│       ├── config/db.js
│       ├── models/                 # 10 Mongoose models
│       ├── controllers/            # request handling per resource
│       ├── routes/                 # REST route definitions + validation
│       ├── middleware/             # auth, roles, uploads, errors, validation
│       └── utils/                  # jwt, notifications, dates, seed
└── client/
    └── src/
        ├── App.jsx                 # all routes, guarded by role
        ├── api/client.js           # axios instance + token interceptor
        ├── context/AuthContext.jsx
        ├── components/             # layout, cards, chart, UI kit, pet tabs
        ├── pages/
        │   ├── public/             # landing, lost-pet scan page, 404
        │   ├── auth/               # login, register
        │   ├── owner/              # dashboard, pets, passport, booking flow
        │   ├── provider/           # dashboard, profile, services, bookings
        │   └── admin/              # overview, verification, users, bookings
        └── lib/                    # constants and formatters
```

---

## Data models

| Model | Holds | Key relationships |
|---|---|---|
| `User` | name, email, hashed password, role, phone, city, active flag | — |
| `Pet` | name, photo, type, breed, DOB, gender, size, weight + history, description, medical warning, QR token, per-field sharing settings | → `User` (owner) |
| `HealthRecord` | vet visits, treatments, medications, allergies, conditions, reports, prescriptions, attachments | → `Pet`, `User` |
| `Vaccination` | vaccine name, given date, next due date, vet, batch, certificate | → `Pet` |
| `ServiceProvider` | business name, categories, description, experience, city, animals/sizes handled, weekly availability, verification status, rating | → `User` |
| `Service` | title, category, description, price, duration, animal types | → `ServiceProvider` |
| `Booking` | date, time slot, price, notes, status, status reason | → `User`, `Pet`, `ServiceProvider`, `Service` |
| `Review` | 1–5 rating, comment | → `Booking` (unique), `ServiceProvider`, `User`, `Pet` |
| `Notification` | type, title, message, deep link, read flag | → `User` |
| `QrScan` | scan time, whether a location was shared, coordinates, accuracy, finder name/contact/message | → `Pet` |

---

## API reference

All protected routes expect `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method | Path | Access |
|---|---|---|
| POST | `/register` | public |
| POST | `/login` | public |
| GET | `/me` | any signed-in user |
| PUT | `/me` | any signed-in user |
| PUT | `/password` | any signed-in user |

### Pets — `/api/pets`
| Method | Path | Purpose |
|---|---|---|
| GET | `/` | list the owner's pets |
| POST | `/` | create a pet (multipart, `photo`) |
| GET · PUT · DELETE | `/:id` | read, update, remove |
| POST | `/:id/weight` | log a weigh-in |
| DELETE | `/:id/weight/:entryId` | remove a weigh-in |
| GET | `/:id/dashboard` | everything the growth & health dashboard renders |
| GET | `/:id/timeline` | merged chronological care history |
| GET | `/:id/qr` | QR data URL + tag link |
| POST | `/:id/qr/regenerate` | invalidate a lost tag and issue a new one |
| GET | `/:id/scans` | scan and found-location history |

### Health passport
`/api/health-records/pet/:petId` (GET, POST) · `/api/health-records/:id` (PUT, DELETE)
`/api/vaccinations/pet/:petId` (GET, POST) · `/api/vaccinations/:id` (PUT, DELETE)

### Providers & services
`/api/providers` (GET public search, POST own profile) · `/api/providers/me` · `/api/providers/me/stats` · `/api/providers/:id` · `PATCH /api/providers/:id/status` (admin)
`/api/services` (GET, POST) · `/api/services/mine` · `/api/services/:id` (GET, PUT, DELETE) · `/api/services/:id/slots?date=` (open slots for a date)

### Bookings & reviews
`POST /api/bookings` · `GET /api/bookings/mine` · `GET /api/bookings/provider` · `GET /api/bookings/:id` · `PATCH /api/bookings/:id/status`
`POST /api/reviews` · `GET /api/reviews/mine` · `GET /api/reviews/provider/:providerId` · `DELETE /api/reviews/:id`

### Reminders, notifications, admin
`GET /api/reminders?days=45`
`GET /api/notifications` · `PATCH /api/notifications/read-all` · `PATCH /api/notifications/:id/read` · `DELETE /api/notifications/:id`
`GET /api/admin/stats · /users · /providers · /services · /bookings` · `PATCH /api/admin/users/:id/active`

### Public (no auth — this is what the collar tag opens)
`GET /api/public/pet/:token` — safe pet profile, records the scan
`POST /api/public/pet/:token/found` — save the shared location and alert the owner

---

## How the main workflows behave

**Booking status machine.** `Requested → Accepted → Completed`, with `Rejected` and `Cancelled` as exits. Transitions are enforced server-side: an owner can only cancel; a provider accepts, rejects or completes; a completed booking is final. Double-booking a slot is blocked at the database query level.

**Reviews.** Only the owner of a booking with status `Completed` can review it, one review per booking. Writing or deleting a review recalculates the provider's average rating.

**Verification.** A new provider profile is `pending`. Until an admin sets it to `verified` the provider cannot publish services, does not appear in owner search, and cannot receive bookings. A rejected provider sees the reason, and editing the profile automatically resubmits it.

**Reminders.** There is no cron job. `GET /api/reminders` computes reminders on request from vaccination `nextDueDate` values, medications flagged active, and upcoming bookings — then classifies each one as overdue, soon, upcoming or ongoing.

**Privacy on the lost-pet page.** The pet's name, photo and age are always shown. Breed, description, medical warning, owner name and owner phone are each individually opt-in, set per pet in the pet form. The owner's address is never exposed. The finder's location is requested only after they press the button, and the request fails softly — they can still send a message with no location at all.

---

## What this project demonstrates

MERN full-stack architecture · REST API design · MongoDB relationships and aggregation · CRUD across ten collections · JWT authentication · role-based authorization · file uploads · QR code generation · Browser Geolocation API · data visualisation with charts · a multi-step booking workflow with a status machine · in-app notifications · validation, error handling, loading states and empty states · a responsive React UI.

---

## Future enhancements

Deliberately left out to keep the project within scope, but natural next steps:

- AI/ML health or disease prediction from the passport history
- An AI assistant for pet-care questions
- A recommendation algorithm matching pets to providers
- Live GPS pet tracking rather than one-time scan locations
- Online payments for bookings
- A pet-care community forum
- Email and SMS reminders alongside in-app notifications
- Expense tracking and richer analytics
- Video consultations with vets

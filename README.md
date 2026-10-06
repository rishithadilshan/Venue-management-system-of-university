# University Venue Management System (UVMS)

A MERN application for allocating lecture halls, laboratories and auditoriums
to lectures and special events, with role-based access, conflict detection,
lecturer-to-lecturer exchanges, and request/approval workflows.

## Roles

| Role | Can do |
|---|---|
| **Admin** | Manage users, venues, time slots; allocate/override/cancel bookings; approve or reject requests; view the full schedule |
| **Lecturer** | View own schedule and the full schedule; request a time/venue change; propose exchanges with other lecturers; request venues for special lectures/practicals |
| **Student** | View the full schedule; search for available venues; request a venue/time for a special event; track request status |
| **Lab Assistant** | View laboratory schedules; report a lab as unavailable/under maintenance |

## Architecture

```
React (Vite)  ──HTTP──►  Node/Express API  ──►  MongoDB
     │                         │
     └── role-based routing    └── conflict detection + capacity checks
                                   on every booking, request and exchange
```

Backend enforces every rule server-side (never trusts the frontend):
booking capacity vs. venue capacity, time/venue overlap, and — for
lecturer exchanges — that after a swap neither lecturer double-books
themselves and neither destination venue conflicts with anything else.

See `backend/models` for the MongoDB collections (`users`, `venues`,
`timeSlots`, `courses`, `bookings`, `bookingRequests`, `exchangeRequests`,
`notifications`, `departments`) and `backend/utils/conflictDetection.js`
for the validation logic.

## Running locally (without Docker)

**Prerequisites:** Node 18+, a local or Atlas MongoDB instance.

```bash
# 1. Backend
cd backend
cp .env.example .env      # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run seed               # creates sample venues, time slots, and one user per role
npm run dev                # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                # http://localhost:5173
```

Seeded logins (change these passwords after first login):

| Role | Email | Password |
|---|---|---|
| Admin | admin@uvms.local | Admin@123 |
| Lecturer | lecturer@uvms.local | Lecturer@123 |
| Student | student@uvms.local | Student@123 |
| Lab Assistant | lab@uvms.local | LabAssist@123 |

## Running with Docker Compose

```bash
docker compose up --build
```

This starts MongoDB, the API (port 5000) and the frontend served by nginx
(port 8080). Run `docker compose exec backend npm run seed` once to load
sample data.

## CI/CD

`.github/workflows/ci.yml` installs dependencies, builds the frontend, and
builds both Docker images on every push/PR to `main`. Swap the placeholder
backend step for a real test suite (e.g. Jest + Supertest) as the project
grows, then add a deploy job (push images to a registry, deploy to your
host) after the `docker` job.

## Key implementation notes

- **Time slots are data, not code.** Admin edits them from `/admin/timeslots`;
  nothing is hard-coded, so shifting the whole day's start time is a
  database edit, not a deployment.
- **Recurring weekly lectures** are expanded into individual dated `Booking`
  documents (grouped by `seriesId`) at creation time, so conflict checks
  stay a single simple query regardless of how a booking originated.
- **Exchanges are approve-then-apply.** Accepting an exchange re-validates
  capacity and conflicts against the *current* state of both bookings
  before touching the database, so a stale offer can never corrupt the
  schedule.
- **Notifications** are created server-side whenever an allocation,
  approval, rejection, exchange, or venue-status change affects a user.

## Extending this

- Add automated tests (Jest/Supertest for the API, Vitest/RTL for the
  frontend) and wire them into the CI workflow.
- Add email/push delivery for notifications (currently in-app only).
- Add a reporting screen (Admin's "Reports" item in the nav is a natural
  next feature — utilisation per venue, most-requested time slots, etc.).

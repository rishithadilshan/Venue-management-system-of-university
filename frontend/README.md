# Venue-management-system-of-university
 A web application to easily reserve university lecture halls, labs, and auditoriums.Students and staff can check real-time availability, view seat capacity, and book  time slots. Admins can approve booking requests and manage schedules to stop double booking.

 ## Overview

Universities typically coordinate lecture halls, labs and auditoriums
through spreadsheets or ad-hoc messages between department staff. UVMS
replaces that with a single system where:

- **Admins** build and adjust the timetable, with the system refusing
  any allocation that double-books a venue or exceeds its capacity.
- **Lecturers** can see their schedule, request a different time or
  venue, swap a lecture with a colleague, or request a one-off venue
  for a guest lecture or practical session.
- **Students** can see the full campus schedule, search for a free
  venue, and request one for a society event or workshop.
- **Lab Assistants** can see laboratory bookings and flag a lab as
  unavailable (e.g. for maintenance) so it's excluded from allocation.

Every booking, request and exchange is validated server-side — the
frontend never decides whether something is allowed, it just displays
what the API returns.

## Features by role

| Role | Capabilities |
|---|---|
| **Admin** | Manage users; create/edit venues and time slots; allocate lectures (single date or weekly-recurring); override or cancel any booking; approve/reject change and special-event requests; view the full campus schedule |
| **Lecturer** | View personal schedule; cancel own lectures; request a time/venue change on an existing lecture; request a special venue for a guest lecture or practical; propose and accept/reject exchanges with another lecturer; view the full schedule and search availability |
| **Student** | View the full campus schedule; search venue availability by date, time slot, capacity and facilities; request a venue for a special event; track request status |
| **Lab Assistant** | View laboratory-specific schedules; mark a lab available or under maintenance |

All four roles share: authentication, a notification inbox (populated
automatically on allocation, approval/rejection, exchange and venue
status changes), and read access to the live campus-wide schedule.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router, Vite, Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JSON Web Tokens, bcrypt password hashing |
| Containerization | Docker, Docker Compose, Nginx (frontend static serving + API proxy) |
| CI | GitHub Actions |

## Project structure

```
uvms/
├── backend/
│   ├── config/db.js              # Mongo connection
│   ├── models/                   # Mongoose schemas (see table above)
│   ├── middleware/                # JWT auth, role guard, error handler
│   ├── controllers/                # Request handlers, one file per resource
│   ├── routes/                     # Express routers, mounted in server.js
│   ├── utils/
│   │   ├── conflictDetection.js   # Capacity + overlap validation, availability search
│   │   ├── recurrence.js          # Expands a weekly booking into dated rows
│   │   ├── notify.js              # Notification creation helper
│   │   └── seed.js                # Sample venues/time slots/users
│   ├── server.js                  # App entry point
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/client.js          # Axios instance with JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/            # AppShell (nav), ScheduleGrid, StatusBadge, route guards
│   │   ├── pages/                  # Shared pages (Schedule, Notifications, FindVenue, MyRequests…)
│   │   │   ├── admin/               # Admin-only pages
│   │   │   ├── lecturer/            # Lecturer-only pages
│   │   │   └── labassistant/        # Lab Assistant-only pages
│   │   └── App.jsx                  # Route table, role-guarded
│   ├── nginx.conf                   # SPA fallback + /api proxy (Docker build only)
│   └── Dockerfile
├── docker-compose.yml               # mongo + backend + frontend
├── .github/workflows/ci.yml         # install/build/docker-build on push
└── README.md
```

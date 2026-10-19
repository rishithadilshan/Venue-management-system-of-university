# Venue-management-system-of-university
 A web application to easily reserve university lecture halls, labs, and auditoriums.Students and staff can check real-time availability, view seat capacity, and book  time slots. Admins can approve booking requests and manage schedules to stop double booking.

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

import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_BY_ROLE = {
  ADMIN: [
    { to: "/admin", label: "Overview", end: true },
    { to: "/schedule", label: "University schedule" },
    { to: "/admin/venues", label: "Venues" },
    { to: "/admin/timeslots", label: "Time slots" },
    { to: "/admin/allocate", label: "Allocate lecture" },
    { to: "/admin/requests", label: "Requests" },
    { to: "/admin/users", label: "Users" },
    { to: "/notifications", label: "Notifications" },
  ],
  LECTURER: [
    { to: "/lecturer", label: "My schedule", end: true },
    { to: "/schedule", label: "University schedule" },
    { to: "/lecturer/find-venue", label: "Find a venue" },
    { to: "/lecturer/requests", label: "My requests" },
    { to: "/lecturer/exchanges", label: "Exchanges" },
    { to: "/notifications", label: "Notifications" },
  ],
  STUDENT: [
    { to: "/schedule", label: "University schedule", end: true },
    { to: "/student/find-venue", label: "Find a venue" },
    { to: "/student/requests", label: "My requests" },
    { to: "/notifications", label: "Notifications" },
  ],
  LAB_ASSISTANT: [
    { to: "/lab", label: "Laboratory schedule", end: true },
    { to: "/lab/status", label: "Lab status" },
    { to: "/notifications", label: "Notifications" },
  ],
};

const ROLE_LABEL = {
  ADMIN: "Admin",
  LECTURER: "Lecturer",
  STUDENT: "Student",
  LAB_ASSISTANT: "Lab Assistant",
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const links = NAV_BY_ROLE[user.role] || [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <span className="brand">Venue &amp; Timetable</span>
          <span className="brand-sub">University Scheduling</span>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="user-card">
          <div>{user.name}</div>
          <span className="role-badge">{ROLE_LABEL[user.role]}</span>
          <button className="logout" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

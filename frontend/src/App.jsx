import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { RequireAuth, RequireRole } from "./components/RouteGuards";
import AppShell from "./components/AppShell";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Schedule from "./pages/Schedule";
import Notifications from "./pages/Notifications";
import FindVenue from "./pages/FindVenue";
import MyRequests from "./pages/MyRequests";
import NotFound from "./pages/NotFound";

import AdminOverview from "./pages/admin/Overview";
import AdminVenues from "./pages/admin/Venues";
import AdminTimeSlots from "./pages/admin/TimeSlots";
import AdminAllocate from "./pages/admin/Allocate";
import AdminRequests from "./pages/admin/Requests";
import AdminUsers from "./pages/admin/Users";

import LecturerMySchedule from "./pages/lecturer/MySchedule";
import LecturerExchanges from "./pages/lecturer/Exchanges";

import LabSchedule from "./pages/labassistant/LabSchedule";
import LabStatus from "./pages/labassistant/LabStatus";

function HomeRedirect() {
  const { user } = useAuth();
  const target = { ADMIN: "/admin", LECTURER: "/lecturer", STUDENT: "/schedule", LAB_ASSISTANT: "/lab" }[
    user.role
  ];
  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/notifications" element={<Notifications />} />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RequireRole roles={["ADMIN"]}>
              <AdminOverview />
            </RequireRole>
          }
        />
        <Route
          path="/admin/venues"
          element={
            <RequireRole roles={["ADMIN"]}>
              <AdminVenues />
            </RequireRole>
          }
        />
        <Route
          path="/admin/timeslots"
          element={
            <RequireRole roles={["ADMIN"]}>
              <AdminTimeSlots />
            </RequireRole>
          }
        />
        <Route
          path="/admin/allocate"
          element={
            <RequireRole roles={["ADMIN"]}>
              <AdminAllocate />
            </RequireRole>
          }
        />
        <Route
          path="/admin/requests"
          element={
            <RequireRole roles={["ADMIN"]}>
              <AdminRequests />
            </RequireRole>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireRole roles={["ADMIN"]}>
              <AdminUsers />
            </RequireRole>
          }
        />

        {/* Lecturer */}
        <Route
          path="/lecturer"
          element={
            <RequireRole roles={["LECTURER"]}>
              <LecturerMySchedule />
            </RequireRole>
          }
        />
        <Route
          path="/lecturer/find-venue"
          element={
            <RequireRole roles={["LECTURER"]}>
              <FindVenue />
            </RequireRole>
          }
        />
        <Route
          path="/lecturer/requests"
          element={
            <RequireRole roles={["LECTURER"]}>
              <MyRequests />
            </RequireRole>
          }
        />
        <Route
          path="/lecturer/exchanges"
          element={
            <RequireRole roles={["LECTURER"]}>
              <LecturerExchanges />
            </RequireRole>
          }
        />

        {/* Student */}
        <Route
          path="/student/find-venue"
          element={
            <RequireRole roles={["STUDENT"]}>
              <FindVenue />
            </RequireRole>
          }
        />
        <Route
          path="/student/requests"
          element={
            <RequireRole roles={["STUDENT"]}>
              <MyRequests />
            </RequireRole>
          }
        />

        {/* Lab Assistant */}
        <Route
          path="/lab"
          element={
            <RequireRole roles={["LAB_ASSISTANT"]}>
              <LabSchedule />
            </RequireRole>
          }
        />
        <Route
          path="/lab/status"
          element={
            <RequireRole roles={["LAB_ASSISTANT"]}>
              <LabStatus />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

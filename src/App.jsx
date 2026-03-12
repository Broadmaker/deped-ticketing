// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }    from './context/useAuth.jsx'
import { UsersProvider }   from './context/useUsers.jsx'
import { OfficesProvider } from './context/useOffices.jsx'
import { TicketProvider }  from './context/useTickets.jsx'
import { ToastProvider }   from './components/ui/Toast.jsx'
import ProtectedRoute      from './components/ui/ProtectedRoute.jsx'

// Layouts
import PublicLayout from './components/layouts/PublicLayout.jsx'
import AdminLayout  from './components/layouts/AdminLayout.jsx'

// Public pages
import AdminCsm      from './pages/admin/AdminCsm.jsx'
import CsmPage      from './pages/public/CsmPage.jsx'
import HomePage   from './pages/public/HomePage.jsx'
import SubmitPage from './pages/public/SubmitPage.jsx'
import TrackPage  from './pages/public/TrackPage.jsx'
import LoginPage  from './pages/public/LoginPage.jsx'

// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard.jsx'
import AdminTicketList   from './pages/admin/AdminTicketList.jsx'
import AdminTicketDetail from './pages/admin/AdminTicketDetail.jsx'
import AdminUsers        from './pages/admin/AdminUsers.jsx'
import AdminOffices      from './pages/admin/AdminOffices.jsx'
import AdminSettings     from './pages/admin/AdminSettings.jsx'
import AdminReports      from './pages/admin/AdminReports.jsx'

export default function App() {
  return (
    <AuthProvider>
      <UsersProvider>
        <OfficesProvider>
          <TicketProvider>
            <ToastProvider>
              <Routes>

                {/* ── Public ──────────────────────────── */}
                <Route element={<PublicLayout />}>
                  <Route path="/"       element={<HomePage />} />
                  <Route path="/submit" element={<SubmitPage />} />
                  <Route path="/csm/:token" element={<CsmPage />} />
        <Route path="/track"  element={<TrackPage />} />
                </Route>

                {/* ── Login ───────────────────────────── */}
                <Route path="/admin/login" element={<LoginPage />} />

                {/* ── Admin (Protected) ───────────────── */}
                <Route
                  path="/admin"
                  element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}
                >
                  <Route index              element={<AdminDashboard />} />
                  <Route path="tickets"     element={<AdminTicketList />} />
                  <Route path="tickets/:id" element={<AdminTicketDetail />} />
                  <Route path="users"       element={<AdminUsers />} />
                  <Route path="offices"     element={<AdminOffices />} />
                  <Route path="settings"    element={<AdminSettings />} />
                  <Route path="reports"     element={<AdminReports />} />
                  <Route path="csm"         element={<AdminCsm />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </ToastProvider>
          </TicketProvider>
        </OfficesProvider>
      </UsersProvider>
    </AuthProvider>
  )
}
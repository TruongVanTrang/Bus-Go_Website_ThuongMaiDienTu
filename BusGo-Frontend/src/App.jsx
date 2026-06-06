import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ChatBot from './components/chat/ChatBot'
import HomePage from './customer/pages/HomePage'
import SearchResultsPage from './customer/pages/SearchResultsPage'
import BookingPage from './customer/pages/BookingPage'
import PaymentPage from './customer/pages/PaymentPage'
import VNPayReturnPage from './customer/pages/VNPayReturnPage'
import CargoConsignmentPage from './customer/pages/CargoConsignmentPage'
import EditConsignmentPage from './customer/pages/EditConsignmentPage'
import CargoPaymentPage from './customer/pages/CargoPaymentPage'
import ETicketPage from './customer/pages/ETicketPage'
import UserHistory from './customer/pages/UserHistory'
import WatchlistPage from './customer/pages/WatchlistPage'
import UserProfile from './customer/pages/UserProfile'

// Auth Components
import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import UnauthorizedPage from './auth/UnauthorizedPage'
import { ProtectedRoute, RoleProtectedRoute, StaffProtectedRoute } from './auth/ProtectedRoute'

// Admin Components
import Dashboard from './admin/pages/Dashboard'
import UsersPage from './admin/pages/UsersPage'
import VehiclesPage from './admin/pages/VehiclesPage'
import RoutesPage from './admin/pages/RoutesPage'
import SchedulesPage from './admin/pages/SchedulesPage'
import ReportsPage from './admin/pages/ReportsPage'
import DriverCargoPage from './admin/pages/DriverCargoPage'
import SupportCargoPage from './admin/pages/SupportCargoPage'
import TicketStaffPage from './admin/pages/TicketStaffPage'

// Driver Components
import DriverDashboard from './driver/pages/DriverDashboard'
import { USER_ROLES } from './utils/constants'

// Support Staff Components
import SupportDashboard from './support-staff/pages/SupportDashboard'

// Reset scroll lên đầu trang mỗi khi navigate sang route mới
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, search])
  return null
}

// Layout wrapper dùng chung
function PageLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ChatBot />
    </div>
  )
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ==================== AUTH ROUTES ==================== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ==================== ADMIN ROUTES (Staff only) ==================== */}
        <Route
          path="/admin/dashboard"
          element={
            <StaffProtectedRoute>
              <Dashboard />
            </StaffProtectedRoute>
          }
        />
        <Route path="/admin/users" element={<StaffProtectedRoute><UsersPage /></StaffProtectedRoute>} />
        <Route path="/admin/vehicles" element={<StaffProtectedRoute><VehiclesPage /></StaffProtectedRoute>} />
        <Route path="/admin/routes" element={<StaffProtectedRoute><RoutesPage /></StaffProtectedRoute>} />
        <Route path="/admin/schedules" element={<StaffProtectedRoute><SchedulesPage /></StaffProtectedRoute>} />
        <Route path="/admin/reports" element={<StaffProtectedRoute><ReportsPage /></StaffProtectedRoute>} />

        {/* DRIVER ROUTES */}
        <Route path="/admin/driver/cargo" element={<StaffProtectedRoute><DriverCargoPage defaultTab="cargo" /></StaffProtectedRoute>} />
        <Route path="/admin/driver/schedule" element={<StaffProtectedRoute><DriverCargoPage defaultTab="schedule" /></StaffProtectedRoute>} />
        <Route path="/admin/driver/trip-status" element={<StaffProtectedRoute><DriverCargoPage defaultTab="trip-status" /></StaffProtectedRoute>} />

        {/* TICKET STAFF ROUTES */}
        <Route path="/admin/staff/scan" element={<StaffProtectedRoute><TicketStaffPage /></StaffProtectedRoute>} />
        <Route path="/admin/staff/passengers" element={<StaffProtectedRoute><TicketStaffPage /></StaffProtectedRoute>} />

        {/* SUPPORT STAFF ROUTES */}
        <Route path="/admin/support/lookup" element={<StaffProtectedRoute><SupportCargoPage defaultTab="lookup" /></StaffProtectedRoute>} />
        <Route path="/admin/support/refund" element={<StaffProtectedRoute><SupportCargoPage defaultTab="refund" /></StaffProtectedRoute>} />

        {/* ==================== DRIVER ROUTES ==================== */}
        <Route
          path="/driver/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={[USER_ROLES.DRIVER, USER_ROLES.TRUCK_DRIVER]}>
              <DriverDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* ==================== CLIENT ROUTES ==================== */}
        <Route path="/" element={<PageLayout><HomePage /></PageLayout>} />
        <Route path="/home" element={<PageLayout><HomePage /></PageLayout>} />
        <Route path="/search" element={<PageLayout><SearchResultsPage /></PageLayout>} />
        <Route path="/booking/:tripId" element={<PageLayout><BookingPage /></PageLayout>} />
        <Route path="/payment" element={<PageLayout><PaymentPage /></PageLayout>} />
        <Route path="/vnpay-return" element={<PageLayout><VNPayReturnPage /></PageLayout>} />
        <Route path="/cargo-consignment" element={<PageLayout><CargoConsignmentPage /></PageLayout>} />
        <Route path="/edit-consignment" element={<PageLayout><EditConsignmentPage /></PageLayout>} />
        <Route path="/cargo-payment" element={<PageLayout><CargoPaymentPage /></PageLayout>} />
        <Route path="/ticket/:bookingId" element={<PageLayout><ETicketPage /></PageLayout>} />
        <Route path="/history" element={<PageLayout><UserHistory /></PageLayout>} />
        <Route path="/watchlist" element={<PageLayout><WatchlistPage /></PageLayout>} />
        <Route path="/profile" element={<PageLayout><UserProfile /></PageLayout>} />

        {/* ==================== SUPPORT STAFF ROUTES ==================== */}
        <Route
          path="/admin/support/chat"
          element={
            <RoleProtectedRoute allowedRoles={[USER_ROLES.SUPPORT_STAFF]}>
              <SupportDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/support/cancellations"
          element={
            <RoleProtectedRoute allowedRoles={[USER_ROLES.SUPPORT_STAFF]}>
              <SupportDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* ==================== CATCH ALL ==================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

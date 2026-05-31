import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ChatBot from './components/chat/ChatBot'
import HomePage from './customer/pages/HomePage'
import SearchResultsPage from './customer/pages/SearchResultsPage'
import BookingPage from './customer/pages/BookingPage'
import PaymentPage from './customer/pages/PaymentPage'
import CargoConsignmentPage from './customer/pages/CargoConsignmentPage'
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

// Reset scroll lên đầu trang mỗi khi navigate sang route mới
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, search])
  return null
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
        <Route
          path="/admin/users"
          element={
            <StaffProtectedRoute>
              <UsersPage />
            </StaffProtectedRoute>
          }
        />

        {/* ==================== CLIENT ROUTES (No auth required) ==================== */}
        <Route
          path="/"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <HomePage />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/home"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <HomePage />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/search"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <SearchResultsPage />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/booking/:tripId"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <BookingPage />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/payment"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <PaymentPage />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/cargo-consignment"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <CargoConsignmentPage />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/ticket/:bookingId"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <ETicketPage />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/history"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <UserHistory />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/watchlist"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <WatchlistPage />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />
        <Route
          path="/profile"
          element={
            <div className="d-flex flex-column min-vh-100">
              <Header />
              <main className="flex-grow-1">
                <UserProfile />
              </main>
              <Footer />
              <ChatBot />
            </div>
          }
        />

        {/* ==================== CATCH ALL ==================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

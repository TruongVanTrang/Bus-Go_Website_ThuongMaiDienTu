import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import ChatBot from './components/chat/ChatBot'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import BookingPage from './pages/BookingPage'
import PaymentPage from './pages/PaymentPage'
import CargoConsignmentPage from './pages/CargoConsignmentPage'
import ETicketPage from './pages/ETicketPage'
import UserHistory from './pages/UserHistory'
import WatchlistPage from './pages/WatchlistPage'
import UserProfile from './pages/UserProfile'

// Auth Components
import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import UnauthorizedPage from './auth/UnauthorizedPage'
import { ProtectedRoute, RoleProtectedRoute, StaffProtectedRoute } from './auth/ProtectedRoute'

// Admin Components
import Dashboard from './admin/pages/Dashboard'

function App() {
  return (
    <Router>
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

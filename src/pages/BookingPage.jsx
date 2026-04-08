import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SeatMap from '../components/booking/SeatMap'
import BookingSummary from '../components/booking/BookingSummary'
import './BookingPage.css'

export default function BookingPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [passengerInfo, setPassengerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  // Mock trip data
  useEffect(() => {
    const mockTrip = {
      id: tripId,
      from: 'Hà Nội',
      to: 'Sài Gòn',
      departureTime: '08:00',
      date: '2024-01-15',
      operator: 'BusGo Express',
      busType: 'bus',
      seats: 45,
      price: 250000,
      occupiedSeats: [1, 3, 5, 10, 15, 20, 25]
    }
    setTrip(mockTrip)
  }, [tripId])

  const handleSeatSelect = (seatNumber) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(s => s !== seatNumber)
      } else {
        return [...prev, seatNumber]
      }
    })
  }

  const handlePassengerChange = (e) => {
    const { name, value } = e.target
    setPassengerInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBooking = () => {
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất một ghế')
      return
    }

    if (!passengerInfo.firstName || !passengerInfo.lastName || !passengerInfo.email || !passengerInfo.phone) {
      alert('Vui lòng điền đầy đủ thông tin hành khách')
      return
    }

    // Redirect to payment page
    navigate('/payment', {
      state: {
        trip,
        selectedSeats,
        passengerInfo,
        totalPrice: trip.price
      }
    })
  }

  if (!trip) {
    return <div className="text-center py-5">Loading...</div>
  }

  return (
    <div className="booking-page">
      <div className="container-fluid px-md-5 px-3 py-5">
        <h2 className="mb-5 fw-bold text-neutral-900">Chọn ghế & Đặt chỗ</h2>

        {/* Section 1: Seat Map */}
        <div className="booking-section mb-5">
          <SeatMap
            trip={trip}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatSelect}
          />
        </div>

        {/* Section 2: Passenger Info */}
        <div className="booking-section mb-5">
          <div className="card" style={{ backgroundColor: 'white', borderRadius: '0.75rem' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 text-neutral-900">Thông tin hành khách</h5>
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-600 text-neutral-700">Họ</label>
                  <input
                    type="text"
                    className="form-control form-input"
                    name="firstName"
                    value={passengerInfo.firstName}
                    onChange={handlePassengerChange}
                    placeholder="Nhập họ"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-600 text-neutral-700">Tên</label>
                  <input
                    type="text"
                    className="form-control form-input"
                    name="lastName"
                    value={passengerInfo.lastName}
                    onChange={handlePassengerChange}
                    placeholder="Nhập tên"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-600 text-neutral-700">Email</label>
                  <input
                    type="email"
                    className="form-control form-input"
                    name="email"
                    value={passengerInfo.email}
                    onChange={handlePassengerChange}
                    placeholder="nhap@email.com"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-600 text-neutral-700">Số điện thoại</label>
                  <input
                    type="tel"
                    className="form-control form-input"
                    name="phone"
                    value={passengerInfo.phone}
                    onChange={handlePassengerChange}
                    placeholder="0912345678"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Booking Summary */}
        <div className="booking-section">
          <BookingSummary
            trip={trip}
            selectedSeats={selectedSeats}
            onConfirm={handleBooking}
          />
        </div>
      </div>
    </div>
  )
}

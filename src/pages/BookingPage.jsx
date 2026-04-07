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

    // Simulate booking and redirect to ticket page
    const bookingId = 'BK' + Date.now()
    navigate(`/ticket/${bookingId}`, {
      state: {
        trip,
        selectedSeats,
        passengerInfo
      }
    })
  }

  if (!trip) {
    return <div className="text-center py-5">Loading...</div>
  }

  return (
    <div className="booking-page">
      <div className="container-fluid px-md-5 px-3 py-5">
        <h2 className="mb-4 fw-bold text-neutral-900">Chọn ghế & Đặt chỗ</h2>

        <div className="row gap-4">
          {/* Seat Map */}
          <div className="col-lg-7">
            <SeatMap
              trip={trip}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
            />

            {/* Passenger Info */}
            <div className="card mt-4" style={{ backgroundColor: 'white' }}>
              <div className="card-body">
                <h5 className="fw-bold mb-4">Thông tin hành khách</h5>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-600">Họ</label>
                    <input
                      type="text"
                      className="form-control form-input"
                      name="firstName"
                      value={passengerInfo.firstName}
                      onChange={handlePassengerChange}
                      placeholder="Nhập họ"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-600">Tên</label>
                    <input
                      type="text"
                      className="form-control form-input"
                      name="lastName"
                      value={passengerInfo.lastName}
                      onChange={handlePassengerChange}
                      placeholder="Nhập tên"
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-600">Email</label>
                    <input
                      type="email"
                      className="form-control form-input"
                      name="email"
                      value={passengerInfo.email}
                      onChange={handlePassengerChange}
                      placeholder="nhap@email.com"
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label fw-600">Số điện thoại</label>
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

          {/* Booking Summary */}
          <div className="col-lg-5">
            <BookingSummary
              trip={trip}
              selectedSeats={selectedSeats}
              onConfirm={handleBooking}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

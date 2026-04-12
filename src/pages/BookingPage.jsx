import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import SeatMap from '../components/booking/SeatMap'
import PassengerQuantity from '../components/booking/PassengerQuantity'
import CargoSelector from '../components/booking/CargoSelector'
import Stepper from '../components/common/Stepper'
import BackButton from '../components/common/BackButton'
import { useCargoPrice } from '../hooks/useCargoPrice'
import './BookingPage.css'

export default function BookingPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { calculateCargoPrice, cargoTypes } = useCargoPrice()
  const [trip, setTrip] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [passengerQuantity, setPassengerQuantity] = useState(0)
  const [passengerInfo, setPassengerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    pickupLocation: '',
    dropoffLocation: ''
  })
  const [cargoInfo, setCargoInfo] = useState({
    type: 'none',
    weight: '',
    estimatedPrice: 0
  })

  // Fetch trip data from service (mock or API)
  useEffect(() => {
    // If trip data is passed from SearchResultsPage, use it
    if (location.state?.trip) {
      setTrip(location.state.trip)
    } else {
      // Use fallback mock data with tripId
      setTrip({
        id: parseInt(tripId) || 1,
        from: 'Hà Nội',
        to: 'Sài Gòn',
        departureTime: '08:00',
        date: '2024-01-15',
        category: 'interCity',
        busType: 'bus',
        seats: 35,
        price: 250000,
        amenities: ['AC', 'Wifi', 'Phone Charger'],
        rating: 4.5,
        occupiedSeats: [1, 3, 5, 10, 15, 20, 25]
      })
    }
  }, [tripId, location.state])

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

  const handleCargoTypeChange = (e) => {
    const type = e.target.value
    const price = calculateCargoPrice(type, cargoInfo.weight)
    setCargoInfo(prev => ({
      ...prev,
      type,
      estimatedPrice: price
    }))
  }

  const handleCargoWeightChange = (e) => {
    const weight = e.target.value
    const price = calculateCargoPrice(cargoInfo.type, weight)
    setCargoInfo(prev => ({
      ...prev,
      weight,
      estimatedPrice: price
    }))
  }

  const getTotalPrice = () => {
    if (!trip) return 0
    const seatsToBook = trip.category === 'city' ? passengerQuantity : selectedSeats.length
    return trip.price * seatsToBook + cargoInfo.estimatedPrice
  }

  const handleBooking = () => {
    if (!trip) {
      alert('Chuyến xe không tìm thấy')
      return
    }

    // For city trips, use passenger quantity; for intercity, use selected seats
    const seatsToBook = trip.category === 'city' ? passengerQuantity : selectedSeats.length
    
    if (seatsToBook === 0) {
      alert(trip.category === 'city' ? 'Vui lòng chọn số lượng hành khách' : 'Vui lòng chọn ít nhất một ghế')
      return
    }

    if (!passengerInfo.firstName || !passengerInfo.lastName || !passengerInfo.email || !passengerInfo.phone) {
      alert('Vui lòng điền đầy đủ thông tin hành khách')
      return
    }

    if (!passengerInfo.pickupLocation || !passengerInfo.dropoffLocation) {
      alert('Vui lòng nhập điểm đón và điểm trả khách')
      return
    }

    // Redirect to payment page
    navigate('/payment', {
      state: {
        trip,
        selectedSeats: trip.category === 'city' ? [] : selectedSeats,
        passengerQuantity: trip.category === 'city' ? passengerQuantity : 0,
        passengerInfo,
        cargoInfo,
        totalPrice: getTotalPrice()
      }
    })
  }

  if (!trip) {
    return <div className="text-center py-5">Loading...</div>
  }

  return (
    <div className="booking-page">
      {/* Stepper */}
      <Stepper
        currentStep={0}
        steps={[
          { title: 'Chọn chỗ', description: 'Sơ đồ ghế' },
          { title: 'Thông tin', description: 'Hành khách' },
          { title: 'Thanh toán', description: 'Phương thức' },
          { title: 'Vé', description: 'Hoàn tất' }
        ]}
      />

      <div className="container-fluid px-md-5 px-3 py-5">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton label="Quay lại" />
        </div>

        <h2 className="mb-5 fw-bold text-neutral-900">Chọn ghế & Đặt chỗ</h2>

        {/* Section 1: Seat Selection - Different based on category */}
        <div className="booking-section mb-5">
          {trip.category === 'city' ? (
            <PassengerQuantity
              trip={trip}
              quantity={passengerQuantity}
              onQuantityChange={setPassengerQuantity}
            />
          ) : (
            <SeatMap
              trip={trip}
              selectedSeats={selectedSeats}
              onSeatSelect={handleSeatSelect}
            />
          )}
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

                <div className="col-md-6">
                  <label className="form-label fw-600 text-neutral-700">Điểm đón khách</label>
                  <input
                    type="text"
                    className="form-control form-input"
                    name="pickupLocation"
                    value={passengerInfo.pickupLocation}
                    onChange={handlePassengerChange}
                    placeholder="Nhập địa chỉ đón khách"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-600 text-neutral-700">Điểm trả khách</label>
                  <input
                    type="text"
                    className="form-control form-input"
                    name="dropoffLocation"
                    value={passengerInfo.dropoffLocation}
                    onChange={handlePassengerChange}
                    placeholder="Nhập địa chỉ trả khách"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Cargo Shipping */}
        <div className="booking-section mb-5">
          <CargoSelector
            cargoInfo={cargoInfo}
            onCargoTypeChange={handleCargoTypeChange}
            onCargoWeightChange={handleCargoWeightChange}
            cargoTypes={cargoTypes}
          />
        </div>

        {/* Section 4: Booking Summary */}
        <div className="booking-section mb-5">
          <div className="card" style={{ backgroundColor: 'white', borderRadius: '0.75rem' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 text-neutral-900">Tóm tắt đơn hàng</h5>
              
              <div className="row g-3">
                <div className="col-12">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Giá vé ({trip.category === 'city' ? passengerQuantity : selectedSeats.length} {trip.category === 'city' ? 'hành khách' : 'ghế'}):</span>
                    <span className="fw-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(trip?.price * (trip.category === 'city' ? passengerQuantity : selectedSeats.length) || 0)}
                    </span>
                  </div>
                  
                  {cargoInfo.type !== 'none' && (
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Tiền gửi hàng hóa:</span>
                      <span className="fw-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cargoInfo.estimatedPrice)}
                      </span>
                    </div>
                  )}
                  
                  <hr className="my-2" />
                  
                  <div className="d-flex justify-content-between">
                    <span className="fw-bold text-neutral-900">Tổng cộng:</span>
                    <span className="fw-bold fs-5" style={{ color: '#0066cc' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getTotalPrice())}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Booking Button */}
        <div className="booking-section">
          <button
            onClick={handleBooking}
            className="btn btn-primary w-100 fw-600 py-3"
            style={{ backgroundColor: '#0066cc', borderColor: '#0066cc', fontSize: '1.1rem' }}
          >
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  )
}

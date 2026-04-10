import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import SeatMap from '../components/booking/SeatMap'
import PassengerQuantity from '../components/booking/PassengerQuantity'
import Stepper from '../components/common/Stepper'
import BackButton from '../components/common/BackButton'
import './BookingPage.css'

export default function BookingPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
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

  // Mock trip data
  useEffect(() => {
    // If trip data is passed from SearchResultsPage, use it
    if (location.state?.trip) {
      setTrip(location.state.trip)
    } else {
      // Fallback to mock data
      const mockTrip = {
        id: tripId,
        from: 'Hà Nội',
        to: 'Sài Gòn',
        departureTime: '08:00',
        date: '2024-01-15',
        operator: 'BusGo Express',
        category: 'interCity',
        busType: 'bus',
        seats: 35,
        price: 250000,
        distance: 1650,
        occupiedSeats: [1, 3, 5, 10, 15, 20, 25]
      }
      setTrip(mockTrip)
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

  // Cargo type definitions
  const cargoTypes = {
    none: {
      label: 'Không gửi hàng',
      priceRange: 'Miễn phí',
      minPrice: 0,
      maxPrice: 0
    },
    light: {
      label: 'Hàng nhẹ/Tài liệu (<10kg)',
      priceRange: 'Miễn phí',
      minPrice: 0,
      maxPrice: 0
    },
    heavy: {
      label: 'Hàng nặng (>10kg)',
      priceRange: '3.000đ - 6.500đ/kg',
      minPrice: 3000,
      maxPrice: 6500
    },
    scooter: {
      label: 'Xe tay ga',
      priceRange: '1.000.000đ',
      minPrice: 1000000,
      maxPrice: 1000000
    },
    maxi_scooter: {
      label: 'Xe tay côn/SH',
      priceRange: '1.300.000đ',
      minPrice: 1300000,
      maxPrice: 1300000
    },
    motorcycle: {
      label: 'Gửi xe máy thông thường',
      priceRange: '320.000đ - 400.000đ',
      minPrice: 320000,
      maxPrice: 400000
    }
  }

  // Calculate cargo price based on type and weight/distance
  const calculateCargoPrice = (type, weight = '') => {
    if (type === 'none' || type === 'light') return 0
    
    if (type === 'heavy' && weight) {
      const w = parseFloat(weight)
      if (w < 10) return 0 // Miễn phí nếu < 10kg
      const pricePerKg = (cargoTypes.heavy.minPrice + cargoTypes.heavy.maxPrice) / 2 // Trung bình
      return Math.round(w * pricePerKg)
    }

    if (type === 'scooter') {
      return cargoTypes.scooter.minPrice
    }

    if (type === 'maxi_scooter') {
      return cargoTypes.maxi_scooter.minPrice
    }

    if (type === 'motorcycle') {
      // Random giữa 320k - 400k
      return cargoTypes.motorcycle.minPrice + Math.random() * 
             (cargoTypes.motorcycle.maxPrice - cargoTypes.motorcycle.minPrice)
    }

    return 0
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
    const seatsToBook = trip.category === 'city' ? passengerQuantity : selectedSeats.length
    return trip.price * seatsToBook + cargoInfo.estimatedPrice
  }

  const handleBooking = () => {
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
          <div className="card" style={{ backgroundColor: 'white', borderRadius: '0.75rem' }}>
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4 text-neutral-900">Đăng ký gửi hàng hóa (Tùy chọn)</h5>
              
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-600 text-neutral-700">Loại hàng hóa</label>
                  <select
                    className="form-select form-input"
                    value={cargoInfo.type}
                    onChange={handleCargoTypeChange}
                  >
                    {Object.entries(cargoTypes).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label} - {value.priceRange}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show weight input for heavy cargo */}
                {cargoInfo.type === 'heavy' && (
                  <div className="col-12">
                    <label className="form-label fw-600 text-neutral-700">Cân nặng (kg) - Tối thiểu 10kg</label>
                    <input
                      type="number"
                      className="form-control form-input"
                      min="10"
                      step="0.5"
                      value={cargoInfo.weight}
                      onChange={handleCargoWeightChange}
                      placeholder="Nhập cân nặng từ 10kg trở lên"
                    />
                    {cargoInfo.weight && parseFloat(cargoInfo.weight) >= 10 && (
                      <small className="text-muted">
                        Ước tính: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cargoInfo.estimatedPrice)}
                      </small>
                    )}
                    {cargoInfo.weight && parseFloat(cargoInfo.weight) < 10 && (
                      <small className="text-success">
                        Miễn phí (dưới 10kg)
                      </small>
                    )}
                  </div>
                )}

                {/* Price estimate for motorcycle */}
                {(cargoInfo.type === 'motorcycle' || cargoInfo.type === 'scooter' || cargoInfo.type === 'maxi_scooter') && (
                  <div className="col-12">
                    <div className="alert alert-info mb-0">
                      <div className="small">
                        <strong>Cước phí:</strong> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cargoInfo.estimatedPrice)}
                      </div>
                    </div>
                  </div>
                )}

                {cargoInfo.type === 'light' && (
                  <div className="col-12">
                    <div className="alert alert-success mb-0">
                      <div className="small">
                        <strong>Cước phí:</strong> Miễn phí
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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

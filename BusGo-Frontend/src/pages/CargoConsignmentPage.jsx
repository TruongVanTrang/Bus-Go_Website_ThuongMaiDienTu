import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiArrowRight, FiDownload, FiEdit2, FiAlertCircle } from 'react-icons/fi'
import { MdDirectionsBus } from 'react-icons/md'
import QRCode from 'qrcode.react'
import Stepper from '../components/common/Stepper'
import BackButton from '../components/common/BackButton'
import { CITY_STOPS, INTERCITY_ROUTES } from '../utils/constants'
import { mockPaymentMethods } from '../utils/mockData'
import './CargoConsignmentPage.css'

export default function CargoConsignmentPage() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const qrRef = useRef(null)

  // Form state
  const [currentStep, setCurrentStep] = useState(1)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureImage, setSignatureImage] = useState(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Step 1: Route Information
  const [routeData, setRouteData] = useState({
    from: '',
    to: '',
    date: '',
    pickupLocationDetail: '',
    deliveryLocationDetail: ''
  })

  // Step 2: Cargo Declaration
  const [cargoData, setCargoData] = useState({
    type: '', // 'documents', 'fragile', 'bulky', 'motorcycle'
    weight: '',
    declaredValue: ''
  })

  // Step 3: Sender/Receiver Information
  const [personData, setPersonData] = useState({
    senderName: '',
    senderPhone: '',
    receiverName: '',
    receiverPhone: ''
  })

  // Step 4: Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('momo')
  const [eSignatureAccepted, setESignatureAccepted] = useState(false)
  const [eConsignmentAccepted, setEConsignmentAccepted] = useState(false)

  const consignmentId = 'CSM' + Date.now()

  // Cargo types configuration
  const cargoTypes = [
    { id: 'documents', label: 'Tài liệu', icon: '📄', desc: 'Tài liệu, sách vở, bộ sưu tập' },
    { id: 'fragile', label: 'Hàng dễ vỡ', icon: '🍷', desc: 'Thủy tinh, sứ, mỹ phẩm' },
    { id: 'bulky', label: 'Hàng cồng kềnh', icon: '📦', desc: 'Đồ dùng gia đình lớn, điện tử' },
    { id: 'motorcycle', label: 'Xe máy', icon: '🏍️', desc: 'Xe máy thông thường hoặc cao cấp' }
  ]

  // Get cargo price based on type and weight
  const getCargoPrice = () => {
    if (!cargoData.type || !cargoData.weight) return 0
    
    const basePrices = {
      documents: 40000,
      fragile: 80000,
      bulky: 150000,
      motorcycle: 300000
    }
    
    const base = basePrices[cargoData.type] || 0
    const weight = parseFloat(cargoData.weight) || 1
    
    if (cargoData.type === 'motorcycle') {
      return base // Fixed price for motorcycle
    }
    
    return Math.ceil(base + (weight - 1) * 10000)
  }

  const getInsurancePrice = () => {
    const declaredValue = parseFloat(cargoData.declaredValue) || 0
    return Math.ceil(declaredValue * 0.02) // 2% insurance fee
  }

  const getTotalPrice = () => {
    return getCargoPrice() + getInsurancePrice()
  }

  // Step 1: Route validation
  const isStep1Complete = routeData.from && routeData.to && routeData.date && routeData.pickupLocationDetail && routeData.deliveryLocationDetail

  // Step 2: Cargo validation
  const isStep2Complete = cargoData.type && cargoData.weight

  // Step 3: Person validation
  const isStep3Complete = personData.senderName && personData.senderPhone && personData.receiverName && personData.receiverPhone


  // Canvas drawing functions
  const startDrawing = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    setSignatureImage(canvas.toDataURL())
    setShowSignaturePad(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setSignatureImage(null)
  }

  const handlePayment = async () => {
    if (!eSignatureAccepted || !eConsignmentAccepted) {
      alert('Vui lòng chấp nhận các điều khoản')
      return
    }

    setConfirmLoading(true)
    
    setTimeout(() => {
      setConfirmLoading(false)
      setIsConfirmed(true)
      
      // Store consignment in localStorage
      const consignments = JSON.parse(localStorage.getItem('busgo_consignments') || '[]')
      consignments.push({
        id: consignmentId,
        ...routeData,
        ...cargoData,
        ...personData,
        paymentMethod: selectedPaymentMethod,
        status: 'pending',
        timestamp: new Date().toISOString(),
        totalPrice: getTotalPrice()
      })
      localStorage.setItem('busgo_consignments', JSON.stringify(consignments))
    }, 2000)
  }

  if (isConfirmed) {
    return (
      <div className="cargo-consignment-page cargo-success">
        <div className="container-fluid px-md-5 px-3 d-flex align-items-center justify-content-center min-vh-100">
          <div className="text-center">
            <div className="success-icon mb-4">
              <FiCheckCircle size={80} className="text-success" />
            </div>
            <h2 className="fw-bold mb-3 text-neutral-900">Yêu cầu ký gửi đã tiếp nhận!</h2>
            <div className="alert alert-info mb-4" style={{ maxWidth: '500px', margin: '0 auto' }}>
              <FiAlertCircle size={20} className="me-2" style={{ display: 'inline' }} />
              <strong>Yêu cầu gửi hàng hóa của bạn đang được công ty kiểm soát.</strong> Công ty sẽ gửi thông báo lại với thông tin chính xác ngày, giờ, địa điểm để nhận hàng. Xin trân trọng cảm ơn!
            </div>
            <div className="text-muted mb-4">
              <p className="small mb-2">Mã ký gửi: <strong>{consignmentId}</strong></p>
              <p className="small">Vui lòng chờ xác nhận từ BusGo...</p>
            </div>
            <div className="mb-5">
              <div className="alert alert-success" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <strong>✓ Thông tin đã được lưu</strong>
                <p className="small mt-2 mb-0">Bạn có thể kiểm tra chi tiết ký gửi trong mục "Lịch sử ký gửi" hoặc quay lại trang chủ.</p>
              </div>
            </div>
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-outline-secondary"
                onClick={() => navigate('/')}
              >
                ← Quay về trang chủ
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/user-history')}
              >
                Xem lịch sử ký gửi →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="cargo-consignment-page">
      {/* Stepper */}
      <Stepper
        currentStep={currentStep}
        steps={[
          { title: 'Tuyến đường', description: 'Chọn tuyến' },
          { title: 'Hàng hóa', description: 'Khai báo' },
          { title: 'Người gửi/nhận', description: 'Thông tin' },
          { title: 'Thanh toán', description: 'Hoàn tất' }
        ]}
      />

      <div className="container-fluid px-md-5 px-3 py-5">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton label="Quay lại" />
        </div>

        {/* Header */}
        <div className="row mb-5">
          <div className="col-12">
            <h1 className="fw-bold text-neutral-900 mb-2">Ký Gửi Hàng Hóa Điện Tử</h1>
            <p className="text-muted">Mã ký gửi: <strong>{consignmentId}</strong></p>
          </div>
        </div>

        {/* STEP 1: Route Information */}
        {currentStep === 1 && (
          <div className="row g-4 mb-5">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body p-5">
                  <h3 className="fw-bold mb-4">Nhập Thông Tin Tuyến Đường</h3>

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-600">Điểm Gửi</label>
                      <select
                        className="form-select"
                        value={routeData.from}
                        onChange={(e) => setRouteData({ ...routeData, from: e.target.value })}
                      >
                        <option value="">-- Chọn điểm gửi --</option>
                        {INTERCITY_ROUTES.map((route, idx) => (
                          <option key={idx} value={route.from}>
                            {route.from}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-600">Điểm Nhận</label>
                      <select
                        className="form-select"
                        value={routeData.to}
                        onChange={(e) => setRouteData({ ...routeData, to: e.target.value })}
                        disabled={!routeData.from}
                      >
                        <option value="">-- Chọn điểm nhận --</option>
                        {INTERCITY_ROUTES.filter(r => r.from === routeData.from).map((route, idx) => (
                          <option key={idx} value={route.to}>
                            {route.to}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-600">Ngày Gửi</label>
                      <input
                        type="date"
                        className="form-control"
                        value={routeData.date}
                        onChange={(e) => setRouteData({ ...routeData, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <hr className="my-4" />

                  <h4 className="fw-bold mb-3">Vị Trí Chi Tiết</h4>

                  <div className="row g-4 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-600">Vị Trí Gửi Hàng <span style={{ color: '#ef4444' }}>*</span></label>
                      <textarea
                        className="form-control"
                        placeholder="Ví dụ: Tòa nhà Techcombank, Tầng 5, Phòng 502"
                        value={routeData.pickupLocationDetail}
                        onChange={(e) => setRouteData({ ...routeData, pickupLocationDetail: e.target.value })}
                        rows="3"
                        maxLength="200"
                      />
                      <small className="text-muted mt-2 d-block">{routeData.pickupLocationDetail.length}/200 ký tự</small>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-600">Vị Trí Nhận Hàng <span style={{ color: '#ef4444' }}>*</span></label>
                      <textarea
                        className="form-control"
                        placeholder="Ví dụ: Cửa hàng XXX, Số 10 Đường YYY, Quận ZZZ"
                        value={routeData.deliveryLocationDetail}
                        onChange={(e) => setRouteData({ ...routeData, deliveryLocationDetail: e.target.value })}
                        rows="3"
                        maxLength="200"
                      />
                      <small className="text-muted mt-2 d-block">{routeData.deliveryLocationDetail.length}/200 ký tự</small>
                    </div>
                  </div>

                  {(!routeData.pickupLocationDetail || !routeData.deliveryLocationDetail) && (
                    <div className="alert alert-warning mt-4">
                      <small>⚠️ Vui lòng nhập chi tiết vị trí gửi và nhận hàng để nhà xe có thể liên hệ và áp dụng chuyến phù hợp</small>
                    </div>
                  )}
                  {isStep1Complete && (
                    <div className="alert alert-success mt-4">
                      <small>✓ Thông tin tuyến đường hoàn chỉnh</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm bg-light">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Thông Tin Tuyến</h5>
                  {routeData.from && routeData.to && routeData.date ? (
                    <>
                      <div className="mb-3">
                        <small className="text-muted d-block">Tuyến đường</small>
                        <strong className="fs-5">{routeData.from}</strong>
                        <div style={{ textAlign: 'center', color: '#0066cc' }} className="my-1">
                          <FiArrowRight />
                        </div>
                        <strong className="fs-5">{routeData.to}</strong>
                      </div>
                      <hr />
                      <div className="mb-3">
                        <small className="text-muted d-block">Ngày gửi</small>
                        <strong>{new Date(routeData.date).toLocaleDateString('vi-VN')}</strong>
                      </div>
                      {routeData.pickupLocationDetail && (
                        <>
                          <hr />
                          <div className="mb-3">
                            <small className="text-muted d-block">📍 Vị trí gửi</small>
                            <small className="text-break" style={{ wordWrap: 'break-word' }}>{routeData.pickupLocationDetail}</small>
                          </div>
                        </>
                      )}
                      {routeData.deliveryLocationDetail && (
                        <>
                          <hr />
                          <div>
                            <small className="text-muted d-block">📍 Vị trí nhận</small>
                            <small className="text-break" style={{ wordWrap: 'break-word' }}>{routeData.deliveryLocationDetail}</small>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="text-muted text-center py-3">
                      <p className="small">Vui lòng chọn thông tin tuyến đường</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Cargo Declaration */}
        {currentStep === 2 && (
          <div className="row g-4 mb-5">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body p-5">
                  <h3 className="fw-bold mb-4">Khai Báo Hàng Hóa</h3>

                  {/* Cargo Type Selection */}
                  <div className="mb-5">
                    <label className="form-label fw-600 mb-3">Loại Hàng Hóa <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className="row g-3">
                      {cargoTypes.map(type => (
                        <div key={type.id} className="col-md-6">
                          <div
                            className="cargo-type-card p-4 rounded-3 cursor-pointer"
                            onClick={() => setCargoData({ ...cargoData, type: type.id })}
                            style={{
                              border: cargoData.type === type.id ? '2px solid #0066cc' : '2px solid #e5e7eb',
                              backgroundColor: cargoData.type === type.id ? '#f0f7ff' : '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.3s'
                            }}
                          >
                            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{type.icon}</div>
                            <div className="fw-600" style={{ color: cargoData.type === type.id ? '#0066cc' : '#1a1a1a' }}>
                              {type.label}
                            </div>
                            <small className="text-muted">{type.desc}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weight Input */}
                  <div className="mb-4">
                    <label className="form-label fw-600">Trọng Lượng Ước Tính (kg) <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Nhập trọng lượng (kg)"
                      value={cargoData.weight}
                      onChange={(e) => setCargoData({ ...cargoData, weight: e.target.value })}
                      min="0.5"
                      step="0.5"
                    />
                    <small className="text-muted mt-2 d-block">
                      {cargoData.type === 'motorcycle' ? 'Xe máy có giá cố định' : 'Trọng lượng ảnh hưởng đến giá cước'}
                    </small>
                  </div>

                  {/* Declared Value Input */}
                  <div className="mb-4">
                    <label className="form-label fw-600">Giá Trị Khai Giá (VND) <span style={{ color: '#999' }}>*Để mua bảo hiểm</span></label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Nhập giá trị hàng hóa (để mua bảo hiểm)"
                      value={cargoData.declaredValue}
                      onChange={(e) => setCargoData({ ...cargoData, declaredValue: e.target.value })}
                      min="0"
                      step="10000"
                    />
                    <small className="text-muted mt-2 d-block">
                      💡 Phí bảo hiểm: 2% giá trị khai giá. Bảo vệ hàng hóa trong quá trình vận chuyển.
                    </small>
                  </div>

                  <div className="alert alert-info">
                    <small>💡 Vui lòng khai báo đầy đủ thông tin hàng hóa để tránh tranh chấp</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm bg-light">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Chi Tiết Chi Phí</h5>
                  
                  {cargoData.type && cargoData.weight ? (
                    <>
                      <div className="mb-2">
                        <small className="text-muted d-block">Loại hàng</small>
                        <strong>{cargoTypes.find(t => t.id === cargoData.type)?.label}</strong>
                      </div>
                      <div className="mb-3">
                        <small className="text-muted d-block">Trọng lượng</small>
                        <strong>{cargoData.weight} kg</strong>
                      </div>
                      <hr />
                      <div className="mb-2">
                        <small className="text-muted d-block">Cước gửi</small>
                        <strong>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getCargoPrice())}
                        </strong>
                      </div>
                      {cargoData.declaredValue && (
                        <>
                          <div className="mb-3">
                            <small className="text-muted d-block">Phí bảo hiểm (2%)</small>
                            <strong>
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getInsurancePrice())}
                            </strong>
                          </div>
                          <hr />
                        </>
                      )}
                      <div>
                        <small className="text-muted d-block">Tổng cộng</small>
                        <strong style={{ fontSize: '1.25rem', color: '#0066cc' }}>
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getTotalPrice())}
                        </strong>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted text-center py-3">
                      <p className="small">Chọn loại hàng và trọng lượng</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Sender/Receiver Information */}
        {currentStep === 3 && (
          <div className="row g-4 mb-5">
            <div className="col-lg-8">
              <div className="card shadow-sm">
                <div className="card-body p-5">
                  <h3 className="fw-bold mb-4">Thông Tin Người Gửi & Người Nhận</h3>

                  {/* Sender Info */}
                  <div className="mb-5">
                    <h5 className="fw-bold mb-4">👤 Người Gửi</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-600">Họ và Tên <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập họ và tên"
                          value={personData.senderName}
                          onChange={(e) => setPersonData({ ...personData, senderName: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-600">Số Điện Thoại <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Nhập số điện thoại"
                          value={personData.senderPhone}
                          onChange={(e) => setPersonData({ ...personData, senderPhone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="my-5" />

                  {/* Receiver Info */}
                  <div className="mb-4">
                    <h5 className="fw-bold mb-4">👤 Người Nhận</h5>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-600">Họ và Tên <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Nhập họ và tên"
                          value={personData.receiverName}
                          onChange={(e) => setPersonData({ ...personData, receiverName: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-600">Số Điện Thoại <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          type="tel"
                          className="form-control"
                          placeholder="Nhập số điện thoại"
                          value={personData.receiverPhone}
                          onChange={(e) => setPersonData({ ...personData, receiverPhone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mt-4">
                    <small>💡 Số điện thoại sẽ được dùng để liên hệ xác nhận giao nhận hàng</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm bg-light">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Thông Tin Tóm Tắt</h5>
                  
                  <div className="mb-3">
                    <small className="text-muted d-block">Người gửi</small>
                    <strong>{personData.senderName || '---'}</strong>
                    <div className="small text-muted">{personData.senderPhone || '---'}</div>
                  </div>

                  <hr />

                  <div className="mb-3">
                    <small className="text-muted d-block">Người nhận</small>
                    <strong>{personData.receiverName || '---'}</strong>
                    <div className="small text-muted">{personData.receiverPhone || '---'}</div>
                  </div>

                  <hr />

                  <div>
                    <small className="text-muted d-block">Tuyến đường</small>
                    <strong>{routeData.from} → {routeData.to}</strong>
                    <div className="small text-muted">{new Date(routeData.date).toLocaleDateString('vi-VN')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Payment & Digital Signature */}
        {currentStep === 4 && (
          <div className="row g-4 mb-5">
            <div className="col-lg-8">
              <div className="card shadow-sm mb-4">
                <div className="card-body p-5">
                  <h3 className="fw-bold mb-4">Thanh Toán & Ký Điện Tử</h3>

                  {/* Payment Methods */}
                  <div className="mb-5">
                    <label className="form-label fw-600 mb-3">Phương Thức Thanh Toán</label>
                    <div className="row g-3">
                      {['momo', 'visa'].map(method => {
                        const methodInfo = {
                          momo: { name: '💳 Ví Momo', desc: 'Thanh toán qua Momo' },
                          visa: { name: '💳 Thẻ Visa/MC', desc: 'Thanh toán qua thẻ tín dụng' }
                        }
                        return (
                          <div key={method} className="col-md-6">
                            <label
                              className="payment-method-card p-4 rounded-3 cursor-pointer"
                              style={{
                                border: selectedPaymentMethod === method ? '2px solid #0066cc' : '2px solid #e5e7eb',
                                backgroundColor: selectedPaymentMethod === method ? '#f0f7ff' : '#fff',
                                cursor: 'pointer'
                              }}
                            >
                              <input
                                type="radio"
                                name="payment"
                                value={method}
                                checked={selectedPaymentMethod === method}
                                onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                                className="me-3"
                              />
                              <div className="fw-600">{methodInfo[method].name}</div>
                              <small className="text-muted">{methodInfo[method].desc}</small>
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Digital Signature */}
                  <div className="mb-5 pb-5 border-bottom">
                    <label className="form-label fw-600 mb-3 d-flex align-items-center gap-2">
                      <FiEdit2 size={20} style={{ color: '#667eea' }} />
                      Ký Điện Tử
                    </label>

                    {!signatureImage ? (
                      <button
                        className="btn btn-outline-primary w-100 mb-3"
                        onClick={() => setShowSignaturePad(true)}
                      >
                        <FiEdit2 size={18} className="me-2" style={{ display: 'inline' }} />
                        Ký Tên của Bạn
                      </button>
                    ) : (
                      <div className="signature-preview mb-3 p-3" style={{ backgroundColor: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
                        <img src={signatureImage} alt="Signature" style={{ maxWidth: '100%', height: 'auto', maxHeight: '150px' }} />
                        <button
                          className="btn btn-sm btn-outline-danger mt-2 w-100"
                          onClick={clearSignature}
                        >
                          Xóa chữ ký
                        </button>
                      </div>
                    )}

                    {showSignaturePad && (
                      <div className="signature-pad-wrapper mb-3">
                        <canvas
                          ref={canvasRef}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          width={500}
                          height={250}
                          style={{
                            border: '2px solid #ddd',
                            borderRadius: '8px',
                            cursor: 'crosshair',
                            width: '100%',
                            marginBottom: '10px',
                            backgroundColor: '#fff'
                          }}
                        />
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-secondary flex-1" onClick={clearSignature}>
                            Xóa
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setShowSignaturePad(false)}>
                            Hủy
                          </button>
                          <button className="btn btn-sm btn-primary flex-1" onClick={saveSignature}>
                            Lưu chữ ký
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms & Conditions */}
                  <div className="mb-4">
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="eSignature"
                        checked={eSignatureAccepted}
                        onChange={(e) => setESignatureAccepted(e.target.checked)}
                        disabled={!signatureImage}
                      />
                      <label className="form-check-label" htmlFor="eSignature">
                        <small>Tôi xác nhận chữ ký điện tử này là của tôi và có giá trị pháp lý theo Luật Thương mại điện tử Việt Nam</small>
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="eConsignment"
                        checked={eConsignmentAccepted}
                        onChange={(e) => setEConsignmentAccepted(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="eConsignment">
                        <small>Tôi đồng ý sử dụng ký gửi điện tử và các điều khoản dịch vụ của BusGo</small>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-4">Mã QR Vận Đơn</h5>
                  <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <QRCode
                      ref={qrRef}
                      value={JSON.stringify({
                        id: consignmentId,
                        from: routeData.from,
                        to: routeData.to,
                        date: routeData.date,
                        sender: personData.senderName,
                        receiver: personData.receiverName
                      })}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <small className="text-muted mt-3 d-block text-center">
                    QR code sẽ được in trên vận đơn điện tử
                  </small>
                </div>
              </div>

              <div className="card shadow-sm mt-4 bg-light">
                <div className="card-body p-4">
                  <h6 className="fw-bold mb-3">Tổng Cộng</h6>
                  <div className="mb-2">
                    <small className="text-muted">Cước gửi</small>
                    <div className="fw-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getCargoPrice())}
                    </div>
                  </div>
                  {getInsurancePrice() > 0 && (
                    <div className="mb-3">
                      <small className="text-muted">Bảo hiểm</small>
                      <div className="fw-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getInsurancePrice())}
                      </div>
                    </div>
                  )}
                  <hr />
                  <div>
                    <small className="text-muted">Thanh toán</small>
                    <div className="fw-bold fs-5" style={{ color: '#0066cc' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(getTotalPrice())}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="d-flex gap-3 justify-content-between">
              <button
                className="btn btn-outline-secondary px-5"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate(-1)}
              >
                {currentStep === 1 ? 'Quay lại' : 'Bước trước'}
              </button>

              {currentStep < 4 ? (
                <button
                  className="btn btn-primary px-5"
                  onClick={() => {
                    if (currentStep === 1 && isStep1Complete) setCurrentStep(2)
                    else if (currentStep === 2 && isStep2Complete) setCurrentStep(3)
                    else if (currentStep === 3 && isStep3Complete) setCurrentStep(4)
                  }}
                  disabled={
                    (currentStep === 1 && !isStep1Complete) ||
                    (currentStep === 2 && !isStep2Complete) ||
                    (currentStep === 3 && !isStep3Complete)
                  }
                >
                  Tiếp tục <FiArrowRight size={18} className="ms-2" style={{ display: 'inline' }} />
                </button>
              ) : (
                <button
                  className="btn btn-success px-5"
                  onClick={handlePayment}
                  disabled={confirmLoading || !eSignatureAccepted || !eConsignmentAccepted}
                >
                  {confirmLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <FiDownload size={18} className="me-2" style={{ display: 'inline' }} />
                      Xác Nhận & Thanh Toán
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

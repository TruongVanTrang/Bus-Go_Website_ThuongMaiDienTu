import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiCheckCircle, FiArrowRight, FiDownload, FiEdit2, FiAlertCircle, FiCamera, FiUpload, FiTrash2, FiPrinter, FiX, FiLock, FiInfo, FiClock } from 'react-icons/fi'
import { MdDirectionsBus, MdLocalShipping, MdCreditCard } from 'react-icons/md'
import QRCode from 'qrcode.react'
import Stepper from '../../components/common/Stepper'
import BackButton from '../../components/common/BackButton'
import { CITY_STOPS, INTERCITY_ROUTES } from '../../utils/constants'
import './CargoConsignmentPage.css'

export default function CargoConsignmentPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Tự động load dữ liệu từ Đặt lại đơn
  useEffect(() => {
    if (location.state && location.state.reorderData) {
      const c = location.state.reorderData;
      setServiceType('gui_kem');
      setSelectedTripId(c.maChuyenXe);
      
      setRouteData({
        from: c.diemGui || '',
        to: c.diemNhan || '',
        date: '', // Khách hàng phải tự chọn lại ngày
        senderAddress: c.diaChiGuiChiTiet || '',
        receiverAddress: c.diaChiNhanChiTiet || ''
      });
      
      setCargoData({
        type: c.loaiHangHoa || 'documents',
        weight: c.trongLuong || '',
        quantity: c.soLuong || 1,
        images: c.hinhAnh || []
      });
      
      setPersonData({
        senderName: c.tenNguoiGui || '',
        senderPhone: c.soDienThoaiNguoiGui || '',
        senderCCCD: c.soCCCD || '',        senderEmail: c.emailNguoiGui || '',
        receiverName: c.tenNguoiNhan || '',
        receiverPhone: c.soDienThoaiNguoiNhan || ''
      });
    } else if (location.state && location.state.payNowData) {
      const c = location.state.payNowData;
      setActiveConsignmentId(c.consignmentId);
      setActiveConsignment(c);
      setConsignmentStatus('da_xac_nhan');
      setIsConfirmed(true);
      setCurrentStep(5);
    }
  }, [location.state]);
  const [isEditingMode, setIsEditingMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const canvasRef = useRef(null)
  const qrRef = useRef(null)
  const videoRef = useRef(null)
  const cameraCanvasRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auth check
  const [isLoggedIn, setIsLoggedIn] = useState(true)
  const [userProfile, setUserProfile] = useState(null)
  const [authToken, setAuthToken] = useState('')

  // System states
  const [currentStep, setCurrentStep] = useState(1)
  const [serviceType, setServiceType] = useState('gui_kem') // 'gui_kem' or 'van_tai'
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [selectedTruckType, setSelectedTruckType] = useState('truck_10t')
  const [isDrawing, setIsDrawing] = useState(false)
  const [signatureImage, setSignatureImage] = useState(null)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [activeConsignmentId, setActiveConsignmentId] = useState(null)
  const [activeConsignment, setActiveConsignment] = useState(null)
  const [dbTrips, setDbTrips] = useState([])
  const [loadingDbTrips, setLoadingDbTrips] = useState(false)

  // Polling states
  const [consignmentStatus, setConsignmentStatus] = useState('dang_cho_xac_nhan')
  const [assignedDriverInfo, setAssignedDriverInfo] = useState('')
  const [paymentLoading, setPaymentLoading] = useState(false)

  // Camera states
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [showMockCamera, setShowMockCamera] = useState(false)
  const [cargoImages, setCargoImages] = useState([])

  // Form states
  const [routeData, setRouteData] = useState({
    from: '',
    to: '',
    date: '',
    pickupLocationDetail: '',
    deliveryLocationDetail: ''
  })

  const [cargoData, setCargoData] = useState({
    type: '', // Empty initially
    weight: '',
    declaredValue: '',
    qty: 1,
    note: ''
  })

  const [personData, setPersonData] = useState({
    senderName: 'Khách hàng mẫu',
    senderPhone: '0912345670',
    senderEmail: 'customer@busgo.vn',
    senderCCCD: '',
    receiverName: '',
    receiverPhone: ''
  })

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('momo')
  const [eSignatureAccepted, setESignatureAccepted] = useState(false)
  const [eConsignmentAccepted, setEConsignmentAccepted] = useState(false)

  // Constants mapping matching index.html/shared.js
  const CARGO_TYPES = {
    documents: { label: 'Tài liệu', basePrice: 40000, icon: '📄' },
    fragile: { label: 'Hàng dễ vỡ', basePrice: 80000, icon: '🍷' },
    bulky: { label: 'Hàng cồng kềnh', basePrice: 150000, icon: '📦' },
    motorcycle: { label: 'Xe máy', basePrice: 300000, icon: '🏍️' }
  }

  const TRUCK_TYPES = {
    truck_5t: { label: 'Xe tải 5 tấn', pricePerKm: 10000, icon: '🚚' },
    truck_10t: { label: 'Xe tải 10 tấn', pricePerKm: 15000, icon: '🚛' },
    truck_30t: { label: 'Xe tải 30 tấn', pricePerKm: 35000, icon: '🚒' }
  }

  const PROVINCE_KM = {
    'Thanh Hóa': 0, 'Nghệ An': 140, 'Hà Tĩnh': 190, 'Quảng Bình': 340,
    'Quảng Trị': 440, 'Huế': 510, 'Đà Nẵng': 610, 'Quảng Nam': 680, 'Quảng Ngãi': 780
  }

  const calculateDistance = (from, to) => {
    let distance = 50
    if (from && to) {
      const kmFrom = PROVINCE_KM[from] ?? 0
      const kmTo = PROVINCE_KM[to] ?? 0
      if ((kmFrom !== 0 || from === 'Thanh Hóa') && (kmTo !== 0 || to === 'Thanh Hóa')) {
         let d = Math.abs(kmFrom - kmTo)
         distance = d < 50 ? 50 : d
      }
    }
    return distance
  }

  // Danh sách chuyến xe sẽ được lấy từ DB - không dùng dữ liệu mẫu nữa

  // Check login and retrieve token/profile on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (!token || !userStr) {
      setIsLoggedIn(false)
    } else {
      setIsLoggedIn(true)
      setAuthToken(token)
      try {
        const profile = JSON.parse(userStr)
        setUserProfile(profile)
        setPersonData(prev => ({
          ...prev,
          senderName: profile.name || profile.tenNguoiDung || 'Khách hàng mẫu',
          senderPhone: profile.phone || profile.soDienThoai || '0912345670',
          senderEmail: profile.email || 'customer@busgo.vn'
        }))
      } catch (e) {
        console.error('Error reading user profile', e)
      }
    }

    // Set date Tomorrow by default on mount
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setRouteData(prev => ({
      ...prev,
      date: tomorrow.toISOString().split('T')[0]
    }))
  }, [])

  // Fetch matching trips from database dynamically
  useEffect(() => {
    if (routeData.from && routeData.to && routeData.date && serviceType === 'gui_kem') {
      const fetchDbTrips = async () => {
        setLoadingDbTrips(true)
        try {
          const res = await fetch(`http://localhost:5000/api/trips/search?diemDi=${routeData.from}&diemDen=${routeData.to}&date=${routeData.date}`)
          if (res.ok) {
            const data = await res.json()
            setDbTrips(data)
          } else {
            setDbTrips([])
          }
        } catch (e) {
          console.warn('Backend trips API offline, falling back to local simulation')
          setDbTrips([])
        } finally {
          setLoadingDbTrips(false)
        }
      }
      fetchDbTrips()
    } else {
      setDbTrips([])
    }
  }, [routeData.from, routeData.to, routeData.date, serviceType])



  const getCargoPrice = () => {
    if (serviceType === 'gui_kem') {
      const selectedTrip = dbTrips.find(t => t.id === selectedTripId)
      const tripPrice = selectedTrip ? selectedTrip.price : 0
      
      const base = CARGO_TYPES[cargoData.type]?.basePrice || 0
      if (!cargoData.type) return tripPrice // Return base trip price if cargo type not selected yet
      
      const w = parseFloat(cargoData.weight) || 0
      const qty = parseInt(cargoData.qty) || 1
      if (cargoData.type === 'motorcycle') {
        return tripPrice + (base * qty)
      }
      // Tính cước siêu rẻ theo yêu cầu: 5,000đ/kg. Tối thiểu 20,000đ/kiện.
      if (w === 0) return tripPrice + (base * qty) // Return base trip price + cargo base if no weight
      const calculatedPrice = w * 5000
      const pricePerItem = Math.max(20000, calculatedPrice)
      return tripPrice + (pricePerItem * qty)
    } else {
      if (!routeData.from || !routeData.to) return 0 // Trả về 0 nếu chưa chọn điểm gửi/nhận
      const pricePerKm = TRUCK_TYPES[selectedTruckType]?.pricePerKm || 0
      const distance = calculateDistance(routeData.from, routeData.to)
      return pricePerKm * distance
    }
  }

  const getInsurancePrice = () => {
    const dVal = parseFloat(cargoData.declaredValue) || 0
    return Math.ceil(dVal * 0.02)
  }

  const getTotalPrice = () => {
    return getCargoPrice() + getInsurancePrice()
  }

  // Validation formulas
  const isStep1Complete = routeData.from && routeData.to && routeData.date && routeData.pickupLocationDetail && routeData.deliveryLocationDetail && (serviceType === 'gui_kem' ? selectedTripId !== null : true)
  const isStep2Complete = cargoData.type && cargoData.weight && cargoData.qty > 0 && (parseInt(cargoData.qty) < 3 || cargoImages.length > 0)
  const isStep3Complete = personData.senderName && personData.senderPhone && personData.senderEmail && personData.senderEmail.includes('@') && personData.senderCCCD && /^[0-9]{12}$/.test(personData.senderCCCD) && personData.receiverName && personData.receiverPhone
  const isStep4Complete = eSignatureAccepted && eConsignmentAccepted && signatureImage !== null

  // Canvas drawing hooks
  useEffect(() => {
    if (currentStep === 4 && canvasRef.current && !signatureImage) {
      const canvas = canvasRef.current
      // Set actual size in memory to match display size
      if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      } else {
        canvas.width = 600
        canvas.height = 200
      }
      
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
    }
  }, [currentStep, signatureImage])

  const getCoordinates = (canvas, clientX, clientY) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // Mouse canvas drawings
  const startDrawingMouse = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(canvas, e.clientX, e.clientY)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const drawMouse = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getCoordinates(canvas, e.clientX, e.clientY)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  // Touch canvas drawings (Mobile)
  const startDrawingTouch = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const touch = e.touches[0]
    const { x, y } = getCoordinates(canvas, touch.clientX, touch.clientY)
    ctx.beginPath()
    ctx.moveTo(x, y)
    e.preventDefault()
  }

  const drawTouch = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const touch = e.touches[0]
    const { x, y } = getCoordinates(canvas, touch.clientX, touch.clientY)
    ctx.lineTo(x, y)
    ctx.stroke()
    e.preventDefault()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const saveSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer)
      const isEmpty = !buffer.some(color => color !== 0)
      if (isEmpty) {
        alert('Vui lòng vẽ chữ ký tay của bạn!')
        return
      }
      setSignatureImage(canvas.toDataURL())
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    setSignatureImage(null)
    setESignatureAccepted(false)
  }

  // Camera capture methods
  const openCamera = () => {
    setShowCameraModal(true)
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        setCameraStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setShowMockCamera(false)
      })
      .catch(err => {
        console.warn('No camera hardware found. Falling back to mockup.', err)
        setShowMockCamera(true)
      })
  }

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    setShowCameraModal(false)
    setShowMockCamera(false)
  }

  const capturePhoto = () => {
    if (cameraStream && videoRef.current) {
      const canvas = cameraCanvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg')
        setCargoImages(prev => [...prev, dataUrl])
        closeCamera()
      }
    } else {
      captureMockPhoto()
    }
  }

  const captureMockPhoto = () => {
    const mockImgs = [
      'https://images.unsplash.com/photo-1566576912321-d58edd7a2858?w=200&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=200&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=200&auto=format&fit=crop&q=60'
    ]
    const random = mockImgs[Math.floor(Math.random() * mockImgs.length)]
    setCargoImages(prev => [...prev, random])
    closeCamera()
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCargoImages(prev => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const removeCargoImage = (idx) => {
    setCargoImages(prev => prev.filter((_, i) => i !== idx))
  }

  // Handle signature submit (No payment, sends to driver/operator approval first)
  const handleRequestSubmit = async () => {
    if (!eSignatureAccepted || !eConsignmentAccepted || !signatureImage) {
      alert('Vui lòng chấp nhận các điều khoản dịch vụ và lưu chữ ký điện tử!')
      return
    }

    setConfirmLoading(true)
    const newId = 'CSM' + Date.now()

    // 1. Prepare data object
    const consignmentData = {
      consignmentId: newId,
      loaiDichVu: serviceType,
      diemGui: routeData.from,
      diemNhan: routeData.to,
      ngayGui: routeData.date,
      diaChiGuiChiTiet: routeData.pickupLocationDetail,
      diaChiNhanChiTiet: routeData.deliveryLocationDetail,
      loaiHangHoa: cargoData.type,
      trongLuong: parseFloat(cargoData.weight) || 1,
      soLuong: parseInt(cargoData.qty) || 1,
      hinhAnh: cargoImages,
      maChuyenXe: serviceType === 'gui_kem' ? selectedTripId : null,
      loaiXeVanTai: serviceType === 'van_tai' ? selectedTruckType : null,
      tenNguoiGui: personData.senderName,
      soDienThoaiNguoiGui: personData.senderPhone,
      soCCCD: personData.senderCCCD,
      emailNguoiGui: personData.senderEmail,
      tenNguoiNhan: personData.receiverName,
      soDienThoaiNguoiNhan: personData.receiverPhone,
      chieKySo: signatureImage,
      giaTrucDeclare: parseFloat(cargoData.declaredValue) || 0
    }

    // 2. Call Backend API
    try {
      const response = await fetch('http://localhost:5000/api/cargo/consignment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(consignmentData)
      })

      if (response.ok) {
        console.log('Saved consignment to backend successfully')
        const resData = await response.json()
        const savedId = resData.consignmentId || newId
        
        // Cập nhật state thành công và chuyển sang bước chờ
        const fullConsignment = {
          ...consignmentData,
          id: savedId,
          maTaiXe: null,
          driverInfo: null,
          trangThaiKyGui: serviceType === 'gui_kem' ? 'dang_cho_xac_nhan' : 'dang_tim_xe_trong',
          trangThaiThanhToan: 'cho_thanh_toan',
          giaCuoc: getCargoPrice(),
          giaBAO_HIEM: getInsurancePrice(),
          tongTien: getTotalPrice(),
          viTriHienTai: serviceType === 'gui_kem' ? 'Chờ xác nhận từ tài xế tuyến' : 'Chờ phân phối xe tải từ trạm điều hành',
          ngayTao: new Date().toISOString(),
          ngayCapNhat: new Date().toISOString()
        }

        setTimeout(() => {
          setConfirmLoading(false)
          setActiveConsignmentId(savedId)
          setActiveConsignment(fullConsignment)
          setCurrentStep(5)
        }, 800)
      } else {
        const errData = await response.json()
        alert('Lỗi tạo đơn: ' + (errData.message || 'Vui lòng thử lại sau.') + (errData.error ? ' Chi tiết: ' + errData.error : ''))
        setConfirmLoading(false)
      }
    } catch (err) {
      alert('Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.')
      setConfirmLoading(false)
    }
  }
  
  // Customer cancels consignment
  const handleCancelConsignment = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy yêu cầu ký gửi này?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/cargo/consignment/${activeConsignmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trangThaiKyGui: 'da_huy' })
      });
      if (response.ok) {
        setConsignmentStatus('da_huy');
        alert("Đã hủy đơn ký gửi thành công.");
      } else {
        alert("Không thể hủy đơn. Vui lòng thử lại sau.");
      }
    } catch(err) {
       console.error("Lỗi hủy đơn:", err);
       alert("Lỗi kết nối máy chủ khi hủy đơn.");
    }
  }

  // Polling hook to look up status updates
  useEffect(() => {
    let interval = null
    if (currentStep === 5 && activeConsignmentId && !isConfirmed) {
      const checkStatus = async () => {
        // Look up local storage
        const list = JSON.parse(localStorage.getItem('busgo_consignments') || '[]')
        const localOrder = list.find(item => item.id === activeConsignmentId)
        
        // Look up backend
        let apiOrder = null
        try {
          const res = await fetch(`http://localhost:5000/api/cargo/consignment/${activeConsignmentId}`)
          if (res.ok) {
            apiOrder = await res.json()
          }
        } catch (e) {
          // backend offline
        }

        const activeOrder = apiOrder || localOrder
        if (activeOrder) {
          setActiveConsignment(activeOrder)
          setConsignmentStatus(activeOrder.trangThaiKyGui)
          if (activeOrder.driverInfo) {
            setAssignedDriverInfo(activeOrder.driverInfo)
          }

          // If payment was completed somewhere else, skip to receipt
          if (activeOrder.trangThaiThanhToan === 'paid') {
            setIsConfirmed(true)
          }
        }
      }

      checkStatus()
      interval = setInterval(checkStatus, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [currentStep, activeConsignmentId, isConfirmed])

  // Payment confirmation click
  const handlePaymentConfirm = () => {
    navigate('/cargo-payment', { 
      state: { 
        activeConsignment: {
          id: activeConsignmentId,
          ...activeConsignment
        }
      } 
    })
  }

  // Parse receipt statuses
  const getReceiptStatusBadge = (status) => {
    switch (status) {
      case 'dang_cho_xac_nhan':
        return { text: '⏳ Đang chờ xác nhận...', class: 'bg-slate-100 text-slate-650 border border-slate-200 animate-pulse', stamp: 'CHỜ DUYỆT', stampClass: 'stamp-pending' }
      case 'dang_tim_xe_trong':
        return { text: '🚚 Đang tìm xe trống...', class: 'bg-blue-50 text-blue-700 border border-blue-100 animate-pulse', stamp: 'ĐANG TÌM XE', stampClass: 'stamp-searching' }
      case 'da_xac_nhan':
        return { text: '✓ Đã được xác nhận', class: 'bg-green-50 text-green-700 border border-green-150', stamp: 'ĐÃ DUYỆT', stampClass: 'stamp-approved' }
      case 'failed':
        return { text: '❌ Từ chối / Hủy đơn', class: 'bg-red-50 text-red-650 border border-red-150', stamp: 'TỪ CHỐI', stampClass: 'stamp-rejected' }
      case 'received_at_station':
        return { text: '🏠 Đã nhận tại trạm', class: 'bg-purple-50 text-purple-700 border border-purple-150', stamp: 'NHẬN KHO', stampClass: 'stamp-transit' }
      case 'in_transit':
        return { text: '🚚 Đang vận chuyển', class: 'bg-indigo-50 text-indigo-700 border border-indigo-150', stamp: 'VẬN CHUYỂN', stampClass: 'stamp-transit' }
      case 'delivered':
        return { text: '✓ Đã giao hàng', class: 'bg-emerald-50 text-emerald-700 border border-emerald-150', stamp: 'ĐÃ GIAO', stampClass: 'stamp-approved' }
      default:
        return { text: status, class: 'bg-slate-50 text-slate-700 border border-slate-200', stamp: 'CARGO', stampClass: 'stamp-pending' }
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setSelectedTripId(null)
    setCargoImages([])
    setSignatureImage(null)
    setESignatureAccepted(false)
    setEConsignmentAccepted(false)
    setIsConfirmed(false)
    setActiveConsignmentId(null)
    setActiveConsignment(null)
    setConsignmentStatus('dang_cho_xac_nhan')
    setAssignedDriverInfo('')
  }

  const handleCancelRequest = async () => {
    const isPaid = activeConsignment?.trangThaiThanhToan === 'paid'
    
    const confirmMsg = isPaid
      ? 'Đơn hàng đã thanh toán. Yêu cầu hủy sẽ được gửi đến nhân viên hỗ trợ để xem xét. Bạn có muốn tiếp tục?'
      : 'Bạn có chắc chắn muốn hủy yêu cầu gửi hàng này?'

    if (!window.confirm(confirmMsg)) {
      return
    }

    const lyDoHuy = isPaid
      ? prompt('Vui lòng cho biết lý do hủy (để nhân viên hỗ trợ xem xét):') || 'Khách hàng yêu cầu hủy'
      : 'Khách hàng hủy trước khi thanh toán'

    try {
      // Gọi API /cancel - backend tự phân biệt đã TT hay chưa
      const response = await fetch(`http://localhost:5000/api/cargo/consignment/${activeConsignmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ lyDoHuy })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.requireApproval) {
          alert('✅ Yêu cầu hủy đã được gửi!\n\nNhân viên hỗ trợ sẽ xem xét và phản hồi trong thời gian sớm nhất.\nTài xế cũng sẽ được thông báo khi đơn được chấp nhận hủy.')
          // Không reset form, chờ NV hỗ trợ duyệt
          return
        } else {
          alert('✅ Đã hủy đơn ký gửi thành công!')
        }
      }
    } catch (e) {
      console.warn('Backend offline when cancelling request')
      // Nếu chưa thanh toán, vẫn hủy ngay locally
      if (!isPaid) {
        alert('✅ Đã hủy đơn (offline).')
      }
    }

    // Chỉ reset form nếu chưa TT (đã TT thì chờ NV duyệt)
    if (!isPaid) {
      resetForm()
    }
  }


  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  // RENDER LOGIN GUARD
  if (!isLoggedIn) {
    return (
      <div className="cargo-consignment-page bg-slate-50 py-5 flex items-center justify-center min-vh-100">
        <div className="card shadow-md border-0 p-5 text-center bg-white rounded-3xl" style={{ maxWidth: '480px' }}>
          <div className="text-primary mb-4">
            <FiLock size={64} className="mx-auto text-primary" style={{ color: '#0066cc' }} />
          </div>
          <h2 className="fw-black text-slate-800 fs-4 mb-3">Yêu Cầu Đăng Nhập</h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">
            Bạn cần đăng nhập vào tài khoản khách hàng BusGo để có thể thực hiện đăng ký ký gửi hàng hóa trực tuyến và ký xác nhận hợp đồng điện tử.
          </p>
          <div className="d-flex flex-column gap-2">
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary w-100 py-2.5 font-bold text-xs"
              style={{ backgroundColor: '#0066cc', borderColor: '#0066cc' }}
            >
              Đăng Nhập Ngay
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn btn-outline-secondary w-100 py-2.5 font-bold text-xs"
            >
              Quay lại Trang Chủ
            </button>
          </div>
        </div>
      </div>
    )
  }

  // RENDER E-RECEIPT VIEW (AFTER PAYMENT IS SUCCESSFUL)
  if (isConfirmed && activeConsignment) {
    const badgeProps = getReceiptStatusBadge(activeConsignment.trangThaiKyGui)
    const typeLabel = CARGO_TYPES[activeConsignment.loaiHangHoa]?.label || activeConsignment.loaiHangHoa

    return (
      <div className="cargo-consignment-page bg-slate-50 py-5">
        <div className="container" style={{ maxWidth: '800px' }}>
          
          <div className="bg-white border border-slate-200 rounded-3xl p-4 md:p-6 shadow-sm mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Hóa đơn điện tử</span>
                <h2 className="fw-black text-slate-800 m-0 fs-4">Biên Lai Cam Kết Gửi Hàng</h2>
              </div>
              <div className={`px-3 py-2 rounded-xl fw-bold text-xs ${badgeProps.class}`}>
                {badgeProps.text}
              </div>
            </div>

            {/* E-Ticket layout */}
            <div className="ticket-stub bg-light p-4 rounded-3 mb-4 overflow-hidden">
              
              {/* E-Ticket Branding Header */}
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-4">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-3">🚌</span>
                  <div>
                    <strong className="text-slate-800 fs-6 block">BUSGO CARGO & LOGISTICS</strong>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Biên nhận ký gửi hàng hóa</span>
                  </div>
                </div>
                <div className="text-center text-md-end">
                  <span className="text-[9px] text-slate-450 uppercase font-bold tracking-wider block">Mã vận đơn</span>
                  <strong className="text-primary fs-5 tracking-wide">{activeConsignment.id}</strong>
                </div>
              </div>

              {/* Email notification */}
              {activeConsignment.emailNguoiGui && (
                <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 text-success rounded-3 text-xs mb-4 d-flex align-items-center gap-2">
                  <span>✉️</span>
                  <span>
                    Bản hợp đồng điện tử <strong>File Word (.docx)</strong> bảo đảm hàng hóa không vi phạm pháp luật đã được gửi về email: <strong className="text-decoration-underline">{activeConsignment.emailNguoiGui}</strong>.
                  </span>
                </div>
              )}

              <hr className="my-4" />

              <div className="row g-4 text-xs">
                {/* Left column: Route and Drivers */}
                <div className="col-md-6 border-end-md">
                  <div className="mb-4">
                    <span className="text-muted block uppercase text-[9px] font-bold tracking-wider">Hành trình</span>
                    <div className="fw-black text-slate-800 fs-6 my-1">
                      {activeConsignment.diemGui} ➔ {activeConsignment.diemNhan}
                    </div>
                    <span className="text-slate-500 block">Ngày gửi: {new Date(activeConsignment.ngayGui).toLocaleDateString('vi-VN')}</span>
                  </div>

                  <div className="mb-4">
                    <span className="text-muted block uppercase text-[9px] font-bold tracking-wider">Tài xế & Phương tiện</span>
                    <div className="bg-white p-3 border rounded-3 mt-1 d-flex align-items-center gap-3 shadow-xs">
                      <span className="fs-4">🛞</span>
                      <div>
                        {activeConsignment.driverInfo ? (
                          <>
                            <strong className="text-slate-800 d-block">{activeConsignment.driverInfo.split(' (')[0]}</strong>
                            <span className="text-slate-500 text-[10px]">{activeConsignment.driverInfo.split(' • ').slice(1).join(' • ').replace(')', '')}</span>
                          </>
                        ) : (
                          <span className="text-muted italic text-[11px] block">
                            Đã phân công tài xế giao nhận
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted block uppercase text-[9px] font-bold tracking-wider">Vị trí hiện tại của hàng</span>
                    <strong className="text-primary mt-1 px-3 py-1.5 bg-white border border-primary border-opacity-25 rounded-3 d-inline-block">
                      📍 {activeConsignment.viTriHienTai || 'Đã tiếp nhận yêu cầu'}
                    </strong>
                  </div>
                </div>

                {/* Right column: Person details & Cargo info */}
                <div className="col-md-6">
                  <div className="mb-4">
                    <span className="text-muted block uppercase text-[9px] font-bold tracking-wider">Người gửi</span>
                    <strong className="text-slate-800 d-block">{activeConsignment.tenNguoiGui}</strong>
                    <span className="text-slate-500">SĐT: {activeConsignment.soDienThoaiNguoiGui}</span>
                    <span className="text-slate-550 d-block">CCCD: {activeConsignment.soCCCD}</span>
                    <span className="text-slate-500 d-block italic mt-1">{activeConsignment.diaChiGuiChiTiet}</span>
                  </div>

                  <div className="mb-4">
                    <span className="text-muted block uppercase text-[9px] font-bold tracking-wider">Người nhận</span>
                    <strong className="text-slate-800 d-block">{activeConsignment.tenNguoiNhan}</strong>
                    <span className="text-slate-550">SĐT: {activeConsignment.soDienThoaiNguoiNhan}</span>
                    <span className="text-slate-500 d-block italic mt-1">{activeConsignment.diaChiNhanChiTiet}</span>
                  </div>

                  <div>
                    <span className="text-muted block uppercase text-[9px] font-bold tracking-wider">Hàng hóa ký gửi</span>
                    <strong className="text-slate-800 block mt-1">{typeLabel} ({activeConsignment.trongLuong} kg)</strong>
                    <span className="text-slate-500">Số lượng: {activeConsignment.soLuong} kiện hàng</span>
                  </div>
                </div>
              </div>

              {/* Dash separator line */}
              <hr className="my-4 border-dashed" />

              {/* Price Breakdown and Signatures */}
              <div className="row g-4 align-items-center">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between mb-1.5">
                    <span className="text-muted">Cước vận chuyển:</span>
                    <strong className="text-slate-700">{formatVND(activeConsignment.giaCuoc)}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Bảo hiểm khai giá:</span>
                    <strong className="text-slate-700">{formatVND(activeConsignment.giaBAO_HIEM)}</strong>
                  </div>
                  <hr className="my-2 border-slate-200" />
                  <div className="d-flex justify-content-between text-sm">
                    <strong className="text-slate-800">Tổng thanh toán:</strong>
                    <strong className="text-success fs-5 fw-black">{formatVND(activeConsignment.tongTien)}</strong>
                  </div>
                  <span className="text-success fw-bold text-[10px] block mt-1.5">✓ ĐÃ THANH TOÁN ĐIỆN TỬ</span>
                </div>

                <div className="col-md-6 text-center d-flex justify-content-center gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Chữ ký khách hàng</span>
                    <div className="border bg-white rounded-3 p-1" style={{ width: '120px', height: '60px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                      <img className="img-fluid object-fit-contain w-100 h-100" src={activeConsignment.chieKySo} alt="Signature" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Đại diện BusGo</span>
                    <div className="border bg-white rounded-3 p-1 d-flex align-items-center justify-content-center" style={{ width: '120px', height: '60px' }}>
                      <span className={`stamp-sec ${badgeProps.stampClass}`}>
                        {badgeProps.stamp}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal notes */}
              <div className="mt-4 pt-3 border-top text-[10px] text-slate-500 leading-normal bg-white bg-opacity-50 p-3 rounded-3 border">
                ⚠️ <strong>Cam kết gửi hàng an toàn:</strong> Bằng chữ ký điện tử trên, Người gửi cam đoan hàng hóa ký gửi hoàn toàn tuân thủ các quy định về an toàn, không chứa chất gây cháy nổ, vũ khí, chất cấm, ma túy, hàng lậu hoặc hàng hóa vi phạm pháp luật nước CHXHCN Việt Nam.
              </div>

            </div>

            {/* Action buttons */}
            <div className="d-flex justify-content-end gap-3">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2 text-xs"
                onClick={resetForm}
              >
                Tạo Đơn Gửi Mới
              </button>
              <button
                type="button"
                className="btn btn-primary px-4 py-2 text-xs"
                onClick={() => window.print()}
              >
                <FiPrinter className="me-2" style={{ display: 'inline' }} /> In Biên Lai
              </button>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // WIZARD FORMS VIEW
  const matchedTrips = dbTrips

  return (
    <div className="cargo-consignment-page pb-5">
      {/* Stepper header */}
      <Stepper
        currentStep={currentStep > 4 ? 4 : currentStep}
        steps={[
          { title: 'Tuyến đường', description: 'Chọn tuyến & dịch vụ' },
          { title: 'Hàng hóa', description: 'Khai báo & Đính kèm' },
          { title: 'Người gửi/nhận', description: 'CCCD & Liên hệ' },
          { title: 'Phê duyệt & Trả phí', description: isEditingMode ? 'Ký số & Cập nhật' : 'Ký số & Thanh toán' }
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton label="Quay lại" />
        </div>

        {/* Header Title with quick mock fill */}
        {currentStep <= 4 && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                Ký Gửi Hàng Hóa Điện Tử
              </h1>
              <p className="text-slate-500 font-medium">Mã ký gửi dự kiến: <strong className="text-slate-800">CSM-PRO</strong></p>
            </div>
          </div>
        )}

        {/* Main Grid Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left panel: Form elements */}
          <div className="w-full lg:w-2/3">
            
            {/* STEP 1-4 */}
            {currentStep <= 4 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="p-6 md:p-10">
                  
                  {/* STEP 1: ROUTE & SERVICE SELECTION */}
                  {currentStep === 1 && (
                    <div className="animate-fade-in">
                      <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 text-xl shadow-inner">📍</span>
                        Chọn Dịch Vụ & Tuyến Đường
                      </h3>

                      {/* Route selector dropdowns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Điểm Gửi</label>
                          <select
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            value={routeData.from}
                            onChange={(e) => {
                              setRouteData(prev => ({ ...prev, from: e.target.value, to: '' }))
                              setSelectedTripId(null)
                            }}
                          >
                            <option value="">-- Chọn tỉnh gửi --</option>
                            <option value="Đà Nẵng">Đà Nẵng</option>
                            <option value="Huế">Huế</option>
                            <option value="Quảng Nam">Quảng Nam</option>
                            <option value="Quảng Ngãi">Quảng Ngãi</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Điểm Nhận</label>
                          <select
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            value={routeData.to}
                            onChange={(e) => {
                              setRouteData(prev => ({ ...prev, to: e.target.value }))
                              setSelectedTripId(null)
                            }}
                            disabled={!routeData.from}
                          >
                            <option value="">-- Chọn tỉnh nhận --</option>
                            {routeData.from !== 'Đà Nẵng' && <option value="Đà Nẵng">Đà Nẵng</option>}
                            {routeData.from !== 'Huế' && <option value="Huế">Huế</option>}
                            {routeData.from !== 'Quảng Nam' && <option value="Quảng Nam">Quảng Nam</option>}
                            {routeData.from !== 'Quảng Ngãi' && <option value="Quảng Ngãi">Quảng Ngãi</option>}
                            <option value="Quảng Trị">Quảng Trị</option>
                            <option value="Quảng Bình">Quảng Bình</option>
                            <option value="Hà Tĩnh">Hà Tĩnh</option>
                            <option value="Nghệ An">Nghệ An</option>
                            <option value="Thanh Hóa">Thanh Hóa</option>
                          </select>
                        </div>
                      </div>

                      {/* Date Picker */}
                      <div className="mb-6">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ngày Gửi Hàng</label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                          value={routeData.date}
                          onChange={(e) => setRouteData(prev => ({ ...prev, date: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      {/* Location detail textareas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Vị Trí Gửi Hàng Chi Tiết <span className="text-red-500">*</span></label>
                          <textarea
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            rows="2"
                            maxLength="200"
                            placeholder="VD: 104 Nguyễn Văn Linh, P. Nam Dương, Q. Hải Châu"
                            value={routeData.pickupLocationDetail}
                            onChange={(e) => setRouteData(prev => ({ ...prev, pickupLocationDetail: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Vị Trí Nhận Hàng Chi Tiết <span className="text-red-500">*</span></label>
                          <textarea
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                            rows="2"
                            maxLength="200"
                            placeholder="VD: Số 5 Lê Lợi, P. Vĩnh Ninh, TP. Huế"
                            value={routeData.deliveryLocationDetail}
                            onChange={(e) => setRouteData(prev => ({ ...prev, deliveryLocationDetail: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* DYNAMIC LISTS */}
                      {routeData.from && routeData.to && routeData.date && (
                        <div className="pt-8 border-t border-slate-100 mt-8">
                          {serviceType === 'gui_kem' ? (
                            <div className="animate-fade-in-up">
                              <h5 className="font-bold text-slate-500 text-xs tracking-wider uppercase mb-4">Danh sách chuyến xe khách phù hợp</h5>
                              {matchedTrips.length === 0 ? (
                                <div className="p-8 border border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center text-slate-500 text-sm">
                                  Không tìm thấy chuyến xe khách nào chạy tuyến này vào ngày đã chọn.
                                </div>
                              ) : (
                                <div className="grid gap-3">
                                  {matchedTrips.map(trip => (
                                    <div
                                      key={trip.id}
                                      className={`p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all duration-200 ${selectedTripId === trip.id ? 'border-blue-500 bg-blue-50 shadow-md transform -translate-y-0.5' : 'border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm'}`}
                                      onClick={() => setSelectedTripId(trip.id)}
                                    >
                                      <div>
                                        <span className="text-[10px] px-2.5 py-1 rounded-md bg-slate-200 text-slate-600 font-bold block mb-2 w-fit">Mã CX{trip.id}</span>
                                        <div className="flex items-center gap-2 mb-1">
                                          <strong className="text-slate-800 text-xl font-black">{trip.departureTime || trip.time}</strong>
                                          <span className="text-xs text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-full">{trip.busType}</span>
                                        </div>
                                        <span className="text-slate-500 text-xs block">Tài xế chạy tuyến: <span className="font-medium">{trip.driver || 'Đang phân bổ'}</span></span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-slate-400 text-[10px] font-bold block mb-1">CƯỚC CƠ BẢN</span>
                                        <strong className="text-blue-600 text-xl font-black">{formatVND(trip.price)}</strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="animate-fade-in-up">
                              <h5 className="font-bold text-slate-500 text-xs tracking-wider uppercase mb-4">Chọn loại xe tải chuyên chở</h5>
                              <div className="grid gap-3">
                                {Object.keys(TRUCK_TYPES).map(key => {
                                  const truck = TRUCK_TYPES[key]
                                  const hasRoute = routeData.from && routeData.to
                                  const distance = hasRoute ? calculateDistance(routeData.from, routeData.to) : 0
                                  const calculatedPrice = hasRoute ? truck.pricePerKm * distance : 0
                                  return (
                                    <div
                                      key={key}
                                      className={`p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer transition-all duration-200 ${selectedTruckType === key ? 'border-indigo-500 bg-indigo-50 shadow-md transform -translate-y-0.5' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-sm'}`}
                                      onClick={() => setSelectedTruckType(key)}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm ${selectedTruckType === key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                          {truck.icon}
                                        </div>
                                        <div>
                                          <strong className="text-slate-800 text-base font-bold block mb-1">{truck.label}</strong>
                                          <span className="text-xs text-slate-500">Khoảng cách dự kiến: {hasRoute ? `~${distance}km` : 'Chưa chọn'}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-slate-400 text-[10px] font-bold block mb-1">CƯỚC BAO XE ({formatVND(truck.pricePerKm)}/km)</span>
                                        <strong className="text-indigo-600 text-xl font-black">{hasRoute ? formatVND(calculatedPrice) : '0 đ'}</strong>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                  {/* STEP 2: CARGO DECLARATION */}
                  {currentStep === 2 && (
                    <div className="animate-fade-in">
                      <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 text-xl shadow-inner">📦</span>
                        Khai Báo Thông Tin Hàng Hóa
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Loại Hàng Hóa</label>
                          <select
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            value={cargoData.type}
                            onChange={(e) => setCargoData(prev => ({ ...prev, type: e.target.value }))}
                          >
                            <option value="" disabled>-- Chọn loại hàng hóa --</option>
                            <option value="documents">📄 Tài liệu, Giấy tờ</option>
                            <option value="fragile">🍷 Hàng dễ vỡ</option>
                            <option value="bulky">📦 Hàng cồng kềnh, Đồ điện tử</option>
                            <option value="motorcycle">🏍️ Xe máy (Giá cước cố định)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Trọng Lượng (KG)</label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            value={cargoData.weight}
                            min="0.5"
                            step="0.5"
                            onChange={(e) => setCargoData(prev => ({ ...prev, weight: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Giá Trị Khai Giá (VND) - Để Mua Bảo Hiểm</label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            value={cargoData.declaredValue}
                            min="0"
                            step="100000"
                            onChange={(e) => setCargoData(prev => ({ ...prev, declaredValue: e.target.value }))}
                          />
                          <span className="text-[10px] text-slate-500 mt-1.5 block">💡 Phí bảo hiểm hàng hóa bằng 2% giá trị khai giá.</span>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Số Lượng Kiện Hàng <span className="text-red-500">*</span></label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            value={cargoData.qty}
                            min="1"
                            onChange={(e) => setCargoData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>

                      {/* Camera Photo Component */}
                      <div className="border border-slate-200 bg-slate-50/50 rounded-2xl p-6 mb-8 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                          <div>
                            <strong className="text-sm font-bold text-slate-800 block mb-1">Hình ảnh kiện hàng thực tế</strong>
                            <span className="text-xs text-slate-500">
                              {parseInt(cargoData.qty) >= 3 ? (
                                <strong className="text-orange-600">Bắt buộc tải ảnh lên vì số lượng kiện hàng &ge; 3.</strong>
                              ) : (
                                'Khuyến khích đính kèm tối thiểu 1 hình ảnh.'
                              )}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="hidden"
                              accept="image/*"
                              multiple
                              onChange={handleFileChange}
                            />
                            <button
                              type="button"
                              className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                              onClick={handleUploadClick}
                            >
                              <FiUpload size={16} /> Album ảnh
                            </button>
                            <button
                              type="button"
                              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                              onClick={openCamera}
                            >
                              <FiCamera size={16} /> Chụp ảnh
                            </button>
                          </div>
                        </div>

                        {/* Warning warning banner */}
                        {parseInt(cargoData.qty) >= 3 && cargoImages.length === 0 && (
                          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-xs mb-4 flex items-center gap-2">
                            <FiAlertCircle size={16} className="flex-shrink-0" />
                            Đơn hàng có từ 3 kiện trở lên bắt buộc phải đính kèm ảnh kiện hàng thực tế.
                          </div>
                        )}

                        {/* Thumbnails grid */}
                        <div className="flex flex-wrap gap-4 mt-4">
                          {cargoImages.length === 0 ? (
                            <div className="w-full py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                              <FiCamera size={24} className="mx-auto text-slate-300 mb-2" />
                              <span className="text-slate-400 font-medium text-xs">Chưa có hình ảnh nào được tải lên</span>
                            </div>
                          ) : (
                            cargoImages.map((src, idx) => (
                              <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                <img className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" src={src} alt="cargo" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <button
                                  type="button"
                                  className="absolute top-2 right-2 bg-white text-red-500 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-50 hover:scale-110 transform"
                                  onClick={() => removeCargoImage(idx)}
                                >
                                  <FiX size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Ghi Chú Vận Chuyển</label>
                        <textarea
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                          rows="3"
                          placeholder="Ghi chú thêm về kích thước hoặc yêu cầu đặc biệt khi vận chuyển..."
                          value={cargoData.note}
                          onChange={(e) => setCargoData(prev => ({ ...prev, note: e.target.value }))}
                        />
                      </div>

                    </div>
                  )}

                  {/* STEP 3: CONTACT & CCCD */}
                  {currentStep === 3 && (
                    <div className="animate-fade-in">
                      <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 text-xl shadow-inner">👤</span>
                        Xác Minh Danh Tính & Liên Hệ
                      </h3>

                      <div className="mb-8">
                        <h5 className="font-black text-teal-600 text-sm tracking-wider uppercase mb-4 border-b border-teal-100 pb-2">Người gửi</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Họ và Tên</label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                              value={personData.senderName}
                              onChange={(e) => setPersonData(prev => ({ ...prev, senderName: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Số Điện Thoại</label>
                            <input
                              type="tel"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                              value={personData.senderPhone}
                              onChange={(e) => setPersonData(prev => ({ ...prev, senderPhone: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Số CCCD Xác Minh <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-mono"
                              placeholder="Nhập 12 số CCCD"
                              maxLength="12"
                              value={personData.senderCCCD}
                              onChange={(e) => setPersonData(prev => ({ ...prev, senderCCCD: e.target.value.replace(/[^0-9]/g, '') }))}
                            />
                            <span className="text-[10px] text-slate-500 mt-1.5 block">💡 Dùng để ghi nhận pháp lý vào biên bản cam kết hàng hóa.</span>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Email Người Gửi <span className="text-red-500">*</span></label>
                            <input
                              type="email"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                              placeholder="VD: customer@busgo.vn"
                              value={personData.senderEmail}
                              onChange={(e) => setPersonData(prev => ({ ...prev, senderEmail: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="font-black text-teal-600 text-sm tracking-wider uppercase mb-4 border-b border-teal-100 pb-2">Người nhận</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Họ và Tên <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                              placeholder="Họ tên người nhận"
                              value={personData.receiverName}
                              onChange={(e) => setPersonData(prev => ({ ...prev, receiverName: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Số Điện Thoại Nhận <span className="text-red-500">*</span></label>
                            <input
                              type="tel"
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                              placeholder="Số điện thoại nhận"
                              value={personData.receiverPhone}
                              onChange={(e) => setPersonData(prev => ({ ...prev, receiverPhone: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* STEP 4: SIGNATURE & SUBMIT APPROVAL */}
                  {currentStep === 4 && (
                    <div className="animate-fade-in">
                      <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                        <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 text-xl shadow-inner">✍️</span>
                        Ký Xác Nhận Hợp Đồng Vận Chuyển
                      </h3>

                      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 flex gap-4 items-start mb-8 shadow-sm">
                        <FiInfo size={24} className="mt-0.5 flex-shrink-0 text-blue-600" />
                        <div className="text-sm leading-relaxed">
                          <strong>Quy trình gửi hàng an toàn:</strong> Sau khi ký xác nhận và gửi yêu cầu, vui lòng chờ <strong className="text-blue-900">Tài xế</strong> (xe khách) hoặc <strong className="text-blue-900">Điều hành</strong> (xe tải) duyệt nhận kiện hàng trước. Sau khi được phê duyệt, bạn mới tiến hành thanh toán tiền cước để nhận biên nhận & gửi hợp đồng về Email.
                        </div>
                      </div>

                      {/* Digital signature canvas box */}
                      <div className="mb-8">
                        <div className="flex justify-between items-end mb-3">
                          <label className="block text-sm font-bold text-slate-700 m-0">Ký Xác Nhận Điện Tử <span className="text-red-500">*</span></label>
                          <button
                            type="button"
                            className="text-red-500 text-xs font-bold hover:text-red-700 transition-colors bg-red-50 px-3 py-1 rounded-full"
                            onClick={clearSignature}
                          >
                            Xóa nét vẽ
                          </button>
                        </div>

                        {!signatureImage ? (
                          <div className="border-2 border-dashed border-purple-300 bg-purple-50/30 rounded-2xl overflow-hidden relative shadow-inner group" style={{ height: '200px' }}>
                            <canvas
                              ref={canvasRef}
                              className="w-full h-full cursor-crosshair"
                              onMouseDown={startDrawingMouse}
                              onMouseMove={drawMouse}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawingTouch}
                              onTouchMove={drawTouch}
                              onTouchEnd={stopDrawing}
                            />
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 group-hover:opacity-10 transition-opacity">
                              <span className="text-4xl">✍️</span>
                            </div>
                            <div className="absolute top-4 left-4 pointer-events-none text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                              Vẽ chữ ký của bạn tại đây
                            </div>
                            <button
                              type="button"
                              className="absolute bottom-4 right-4 bg-purple-600 hover:bg-purple-700 text-white shadow-lg text-xs font-bold px-4 py-2.5 rounded-xl transition-all transform hover:scale-105"
                              onClick={saveSignature}
                            >
                              Lưu nét ký
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-emerald-200 bg-emerald-50 rounded-2xl p-6 text-center shadow-inner relative flex flex-col items-center justify-center h-[200px]">
                            <img className="max-h-[120px] object-contain drop-shadow-md mix-blend-multiply" src={signatureImage} alt="saved sig" />
                            <div className="absolute bottom-4 flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold">
                              <FiCheckCircle /> Chữ ký điện tử đã được ghi nhận thành công
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Checkboxes terms */}
                      <div className="flex flex-col gap-4 text-sm bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                        <label className="flex items-start gap-3 cursor-pointer text-slate-700 group">
                          <input
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
                            checked={eSignatureAccepted}
                            onChange={(e) => setESignatureAccepted(e.target.checked)}
                            disabled={!signatureImage}
                          />
                          <span className={`leading-relaxed ${!signatureImage ? 'opacity-50' : 'group-hover:text-slate-900'}`}>Tôi cam đoan thông tin khai báo về hàng hóa là đúng sự thật và tuân thủ các quy định về hàng cấm gửi của BusGo.</span>
                        </label>
                        <label className="flex items-start gap-3 cursor-pointer text-slate-700 group">
                          <input
                            type="checkbox"
                            className="mt-1 w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
                            checked={eConsignmentAccepted}
                            onChange={(e) => setEConsignmentAccepted(e.target.checked)}
                          />
                          <span className="leading-relaxed group-hover:text-slate-900">Tôi đồng ý sử dụng chữ ký điện tử trên làm căn cứ pháp lý để lập vận đơn gửi hàng này.</span>
                        </label>
                      </div>

                    </div>
                  )}

                  {/* Bottom Step Buttons */}
                  <div className="flex justify-between items-center pt-8 border-t border-slate-100 mt-8">
                    <button
                      type="button"
                      className="bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-bold px-6 py-3 rounded-xl transition-all"
                      onClick={() => {
                        if (currentStep > 1) {
                          setCurrentStep(currentStep - 1)
                        } else {
                          navigate(-1)
                        }
                      }}
                    >
                      Quay lại
                    </button>

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        className="bg-slate-900 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                        Tiếp tục <FiArrowRight size={18} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black px-8 py-3 rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={confirmLoading || !isStep4Complete}
                        onClick={handleRequestSubmit}
                      >
                        {confirmLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Đang xử lý...
                          </>
                        ) : 'Gửi yêu cầu vận chuyển'}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* STEP 5: WAITING FOR APPROVAL & PAYMENT */}
            {currentStep === 5 && (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                <div className="p-8 md:p-12 text-center">
                  
                  {/* Status 1: Waiting */}
                  {(consignmentStatus === 'dang_cho_xac_nhan' || consignmentStatus === 'dang_tim_xe_trong') && (
                    <div className="py-8 animate-fade-in">
                      <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-8 shadow-sm"></div>
                      <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Đang Chờ Phê Duyệt Nhận Hàng</h3>
                      <p className="text-slate-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
                        Yêu cầu gửi hàng của bạn đã gửi đi thành công với mã <strong className="text-slate-800 bg-slate-100 px-2 py-1 rounded">{activeConsignmentId}</strong>. 
                        Vui lòng chờ tài xế xác nhận nhận hàng trực tuyến trước khi thanh toán.
                      </p>
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm max-w-md mx-auto mb-8 flex items-start gap-3 text-left">
                        <span className="text-xl">💡</span>
                        <div className="leading-relaxed">
                          <strong>Để thử nghiệm nhanh:</strong> Hãy mở file <strong>driver.html</strong> (nếu gửi xe khách) hoặc <strong>support.html</strong> (nếu thuê xe tải) ở tab khác và bấm <strong>Duyệt nhận</strong> đơn hàng này.
                        </div>
                      </div>
                      <button 
                        className="bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 font-bold px-6 py-2.5 rounded-xl transition-all"
                        onClick={handleCancelConsignment}
                      >
                        Hủy yêu cầu
                      </button>
                    </div>
                  )}

                  {/* Status 2: Rejected or Cancelled */}
                  {(consignmentStatus === 'failed' || consignmentStatus === 'da_huy') && (
                    <div className="py-8 animate-fade-in">
                      <span className="text-7xl block mb-6 animate-bounce">❌</span>
                      <h3 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">{consignmentStatus === 'da_huy' ? 'Đơn Đã Hủy' : 'Đơn Hàng Bị Từ Chối'}</h3>
                      <p className="text-slate-500 text-base max-w-md mx-auto mb-8 leading-relaxed">
                        {consignmentStatus === 'da_huy' 
                          ? 'Bạn đã hủy yêu cầu vận chuyển đơn hàng này.' 
                          : 'Rất tiếc, tài xế hoặc trạm điều hành đã từ chối nhận vận chuyển đơn hàng này.'}
                      </p>
                      <button onClick={resetForm} className="bg-slate-900 hover:bg-blue-600 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5">
                        Tạo yêu cầu mới
                      </button>
                    </div>
                  )}

                  {/* Status 3: Approved -> NEEDS PAYMENT */}
                  {consignmentStatus === 'da_xac_nhan' && (
                    <div className="py-4 text-left animate-fade-in">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex gap-4 items-center mb-8 shadow-sm">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiCheckCircle size={32} />
                        </div>
                        <div>
                          <strong className="text-emerald-700 block text-lg mb-1">Yêu cầu của bạn đã được chấp nhận!</strong>
                          <span className="text-sm text-slate-600 block">
                            Tài xế/Xe tải: <strong className="text-slate-800">{assignedDriverInfo || 'Đã phân bổ'}</strong>
                          </span>
                        </div>
                      </div>

                      <h4 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                        <span className="text-3xl">💳</span> Thanh Toán Cước Vận Chuyển
                      </h4>
                      
                      {['dang_cho_xac_nhan', 'dang_tim_xe_trong', 'pending'].includes(consignmentStatus) ? (
                        <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-4 text-center">
                          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mb-2">
                            <FiClock size={32} />
                          </div>
                          <strong className="text-amber-600 text-xl font-black tracking-tight">Đang Chờ Phê Duyệt</strong>
                          <p className="text-slate-500 max-w-md">
                            Đơn hàng của bạn đã được gửi thành công và đang chờ xác nhận từ {serviceType === 'gui_kem' ? 'tài xế' : 'nhân viên điều phối'}. Bạn sẽ nhận được thông báo ngay khi đơn hàng được duyệt để tiến hành thanh toán.
                          </p>
                          <div className="flex gap-4 mt-4">
                            <button
                              type="button"
                              className="bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 font-bold px-6 py-3 rounded-xl transition-all"
                              onClick={handleCancelConsignment}
                              disabled={paymentLoading}
                            >
                              Hủy Đơn
                            </button>
                            <button
                              type="button"
                              className="bg-emerald-50 text-emerald-600 border-2 border-emerald-200 hover:bg-emerald-100 font-bold px-8 py-3 rounded-xl transition-all"
                              onClick={() => navigate('/history')}
                            >
                              Về Lịch Sử
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Payment Choice */}
                          <div className="mb-8">
                            <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Phương thức thanh toán</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <label className={`relative p-5 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all duration-300 ${selectedPaymentMethod === 'momo' ? 'border-pink-500 bg-pink-50 shadow-md transform -translate-y-1' : 'border-slate-200 bg-white hover:border-pink-300 hover:shadow-sm'}`}>
                                <input
                                  type="radio"
                                  name="pay-waiting"
                                  value="momo"
                                  className="w-5 h-5 text-pink-600 focus:ring-pink-500 border-slate-300"
                                  checked={selectedPaymentMethod === 'momo'}
                                  onChange={() => setSelectedPaymentMethod('momo')}
                                />
                                <div>
                                  <strong className="text-slate-800 text-base block mb-0.5">📱 Ví Điện Tử MoMo</strong>
                                  <span className="text-xs text-slate-500">Trả qua app MoMo</span>
                                </div>
                                {selectedPaymentMethod === 'momo' && <div className="absolute top-4 right-4 text-pink-500"><FiCheckCircle size={20} /></div>}
                              </label>

                              <label className={`relative p-5 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all duration-300 ${selectedPaymentMethod === 'visa' ? 'border-blue-500 bg-blue-50 shadow-md transform -translate-y-1' : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'}`}>
                                <input
                                  type="radio"
                                  name="pay-waiting"
                                  value="visa"
                                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-slate-300"
                                  checked={selectedPaymentMethod === 'visa'}
                                  onChange={() => setSelectedPaymentMethod('visa')}
                                />
                                <div>
                                  <strong className="text-slate-800 text-base block mb-0.5">💳 Thẻ Visa/Mastercard</strong>
                                  <span className="text-xs text-slate-500">Cổng thanh toán thẻ quốc tế</span>
                                </div>
                                {selectedPaymentMethod === 'visa' && <div className="absolute top-4 right-4 text-blue-500"><FiCheckCircle size={20} /></div>}
                              </label>
                            </div>
                          </div>

                          {/* Pay button */}
                          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="text-center md:text-left">
                              <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider mb-1">Tổng số tiền cần thanh toán</span>
                              <strong className="text-emerald-600 text-4xl font-black tracking-tight">{formatVND(getTotalPrice())}</strong>
                            </div>
                            <div className="flex gap-4 w-full md:w-auto">
                              <button
                                type="button"
                                className="w-full md:w-auto bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 font-bold px-6 py-4 rounded-xl transition-all"
                                onClick={handleCancelConsignment}
                                disabled={paymentLoading}
                              >
                                Hủy Đơn
                              </button>
                              <button
                                type="button"
                                className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black px-8 py-4 rounded-xl shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                                disabled={paymentLoading}
                                onClick={handlePaymentConfirm}
                              >
                                {paymentLoading ? (
                                  <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Đang giao dịch...
                                  </>
                                ) : (
                                  <>
                                    <MdCreditCard size={16} /> {isEditingMode ? 'Cập nhật' : 'Thanh toán'} ngay
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

          {/* Right panel: Summary sidebar */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 sticky top-24 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-900"></div>
              <div className="p-6 md:p-8">
                <h5 className="font-black text-slate-800 text-lg mb-6 border-b border-slate-100 pb-4">TÓM TẮT ĐƠN GỬI</h5>

                <div className="flex flex-col gap-5 text-sm text-slate-600">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Dịch vụ chọn</span>
                    <strong className="text-slate-800 text-base">
                      {serviceType === 'gui_kem' ? 'Gửi kèm xe khách (Tiết kiệm)' : 'Thuê xe vận tải riêng (Chuyên dụng)'}
                    </strong>
                  </div>

                  {routeData.from && routeData.to && routeData.date && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Tuyến hành trình</span>
                      <strong className="text-slate-800 text-lg font-black block mb-1">{routeData.from} ➔ {routeData.to}</strong>
                      <span className="text-slate-500 block">Ngày gửi: <strong className="text-slate-700">{new Date(routeData.date).toLocaleDateString('vi-VN')}</strong></span>
                      
                      {serviceType === 'gui_kem' ? (
                        <span className="text-blue-600 font-bold block mt-2 pt-2 border-t border-slate-200">
                          Chuyến: {selectedTripId ? (matchedTrips.find(t => t.id === selectedTripId)?.departureTime || matchedTrips.find(t => t.id === selectedTripId)?.time || 'Chưa chọn') : 'Chưa chọn chuyến'}
                        </span>
                      ) : (
                        <span className="text-indigo-600 font-bold block mt-2 pt-2 border-t border-slate-200">
                          Xe thuê: {TRUCK_TYPES[selectedTruckType]?.label}
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Thông tin hàng hóa</span>
                    <strong className="text-slate-800 block text-base">
                      {cargoData.type ? CARGO_TYPES[cargoData.type]?.label : 'Chưa khai báo'} <span className="text-slate-500">({cargoData.weight}kg)</span>
                    </strong>
                    <span className="text-slate-500 block mt-1">Số lượng: <strong className="text-slate-700">{cargoData.qty} kiện</strong> • <strong className="text-slate-700">{cargoImages.length}</strong> ảnh đính kèm</span>
                  </div>

                  {personData.senderCCCD && (
                    <div>
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Người gửi (Danh tính)</span>
                      <strong className="text-slate-800 block">{personData.senderName}</strong>
                      <span className="text-slate-500 block">CCCD: {personData.senderCCCD}</span>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <>
                      <hr className="my-2 border-slate-100" />
                      <div>
                        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">Thông tin vận chuyển</span>
                        {assignedDriverInfo ? (
                          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                            <strong className="text-emerald-600 block text-xs mb-1">✓ Đã gán tài xế</strong>
                            <span className="text-slate-800 font-bold">{assignedDriverInfo}</span>
                          </div>
                        ) : serviceType === 'gui_kem' ? (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <strong className="text-slate-700 block text-xs mb-1">Chuyến xe: {selectedTripId ? (matchedTrips.find(t => t.id === selectedTripId)?.departureTime || matchedTrips.find(t => t.id === selectedTripId)?.time) : ''}</strong>
                            <span className="text-slate-500 text-xs">Tài xế dự kiến: {matchedTrips.find(t => t.id === selectedTripId)?.driver || 'Đang phân bổ'} (Chờ xác nhận)</span>
                          </div>
                        ) : (
                          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 animate-pulse">
                            <strong className="text-indigo-600 block text-xs mb-1">⏳ Đang tìm xe tải</strong>
                            <span className="text-indigo-500 text-xs">Chờ điều phối trạm điều hành</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <hr className="my-2 border-slate-200 border-dashed" />

                  <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Cước vận chuyển:</span>
                      <strong className="text-slate-800">{formatVND(getCargoPrice())}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Bảo hiểm khai giá:</span>
                      <strong className="text-slate-800">{formatVND(getInsurancePrice())}</strong>
                    </div>
                    <hr className="border-slate-200" />
                    <div className="flex justify-between items-center">
                      <strong className="text-slate-900 font-black">TỔNG CỘNG:</strong>
                      <strong className="text-blue-600 text-2xl font-black">{formatVND(getTotalPrice())}</strong>
                    </div>
                  </div>
                </div>

                {currentStep === 5 && !isConfirmed && (
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <button
                      type="button"
                      className="w-full bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 font-bold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      onClick={handleCancelRequest}
                    >
                      ❌ Hủy yêu cầu gửi hàng
                    </button>
                  </div>
                )}

                {/* QR code block */}
                {currentStep === 4 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center mt-6">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-4">QR Code Vận Đơn</span>
                    <div className="flex justify-center bg-white p-4 rounded-xl shadow-sm inline-block mx-auto border border-slate-100">
                      <QRCode
                        ref={qrRef}
                        value={JSON.stringify({
                          id: 'CSM-PRO',
                          from: routeData.from,
                          to: routeData.to,
                          date: routeData.date,
                          sender: personData.senderName,
                          receiver: personData.receiverName
                        })}
                        size={140}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* WEBCAM CAMERA MODAL OVERLAY */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl animate-fade-in-up">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <strong className="text-sm font-black text-slate-800 uppercase tracking-wider">Chụp ảnh kiện hàng thực tế</strong>
              <button className="text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-200" onClick={closeCamera}>
                <FiX size={20} />
              </button>
            </div>
            
            <div className="relative bg-black w-full aspect-video flex items-center justify-center overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline></video>
              
              {showMockCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-8">
                  <span className="text-5xl mb-4 opacity-50">📷</span>
                  <strong className="text-white text-lg block font-bold mb-2">Không có webcam kết nối</strong>
                  <span className="text-slate-400 text-sm max-w-sm">Trình duyệt không tìm thấy camera vật lý hoặc quyền truy cập bị từ chối. Hệ thống sẽ tự động tạo ảnh chụp mẫu.</span>
                  <button
                    type="button"
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-colors"
                    onClick={captureMockPhoto}
                  >
                    Sử dụng ảnh mô phỏng
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-between gap-4">
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                onClick={closeCamera}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black px-8 py-2.5 rounded-xl shadow-lg transition-transform transform hover:-translate-y-0.5 flex items-center gap-2"
                onClick={capturePhoto}
              >
                <span className="text-xl">📸</span> Chụp ảnh ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden camera canvas */}
      <canvas ref={cameraCanvasRef} className="d-none" width="640" height="480"></canvas>
    </div>
  )
}

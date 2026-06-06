import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { FiCheckCircle, FiArrowRight, FiDownload, FiEdit2, FiAlertCircle, FiCamera, FiUpload, FiTrash2, FiPrinter, FiX, FiLock, FiInfo } from 'react-icons/fi'
import { MdDirectionsBus, MdLocalShipping, MdCreditCard } from 'react-icons/md'
import QRCode from 'qrcode.react'
import Stepper from '../../components/common/Stepper'
import BackButton from '../../components/common/BackButton'
import { CITY_STOPS, INTERCITY_ROUTES } from '../../utils/constants'
import './CargoConsignmentPage.css'

export default function EditConsignmentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isEditingMode, setIsEditingMode] = useState(true)
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
      const base = CARGO_TYPES[cargoData.type]?.basePrice || 0
      if (base === 0) return 0 // Trả về 0 nếu chưa chọn loại hàng
      const w = parseFloat(cargoData.weight) || 0
      const qty = parseInt(cargoData.qty) || 1
      if (cargoData.type === 'motorcycle') {
        return base * qty
      }
      // Tính cước siêu rẻ theo yêu cầu: 5,000đ/kg. Tối thiểu 20,000đ/kiện.
      if (w === 0) return 0
      const calculatedPrice = w * 5000
      const pricePerItem = Math.max(20000, calculatedPrice)
      return pricePerItem * qty
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
      const ctx = canvas.getContext('2d')
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
    }
  }, [currentStep, signatureImage])

  // Mouse canvas drawings
  const startDrawingMouse = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  const drawMouse = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.stroke()
  }

  // Touch canvas drawings (Mobile)
  const startDrawingTouch = (e) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    ctx.beginPath()
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top)
    e.preventDefault()
  }

  const drawTouch = (e) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches[0]
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top)
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
          setActiveConsignmentId(savedId)
          setActiveConsignment(fullConsignment)
          setConsignmentStatus(fullConsignment.trangThaiKyGui)
          setConfirmLoading(false)
          setCurrentStep(5) // Navigate to waiting screen
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
  const handlePaymentConfirm = async () => {
    setPaymentLoading(true)

    // 1. Call Backend Payment API
    let success = false
    try {
      const response = await fetch(`http://localhost:5000/api/cargo/consignment/${activeConsignmentId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: selectedPaymentMethod })
      })

      if (response.ok) {
        const data = await response.json()
        setActiveConsignment(data.consignment)
        success = true
      }
    } catch (err) {
      console.warn('Backend payment endpoint offline. Processing local mock payment.')
    }

    // 2. Update local storage to synchronize offline prototypes
    const list = JSON.parse(localStorage.getItem('busgo_consignments') || '[]')
    const idx = list.findIndex(item => item.id === activeConsignmentId)
    if (idx !== -1) {
      list[idx].trangThaiThanhToan = 'paid'
      list[idx].ngayCapNhat = new Date().toISOString()
      localStorage.setItem('busgo_consignments', JSON.stringify(list))
      window.dispatchEvent(new Event('storage'))

      if (!success) {
        setActiveConsignment(list[idx])
      }
    }

    setTimeout(() => {
      setPaymentLoading(false)
      setIsConfirmed(true) // Display the final printable E-Receipt
    }, 1500)
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
      

      <div className="container-fluid px-md-5 px-3 py-4">
        {/* Back Button */}
        <div className="mb-4">
          <BackButton label="Quay lại" />
        </div>

        {/* Header Title with quick mock fill */}
        {currentStep <= 4 && (
          <div className="row mb-5 align-items-center">
            <div className="col-md-7">
              <h1 className="fw-black text-neutral-900 mb-1 fs-3">Ký Gửi Hàng Hóa Điện Tử</h1>
              <p className="text-muted mb-0">Mã ký gửi dự kiến: <strong>CSM-PRO</strong></p>
            </div>
            <div className="col-md-5 text-md-end mt-3 mt-md-0">
              {/* Nút nhập dữ liệu mẫu đã bị xóa theo yêu cầu */}
            </div>
          </div>
        )}

        {/* Main Grid Content */}
        <div className="row g-4">
          
          {/* Left panel: Form elements */}
          <div className="col-lg-8">
            
            {/* STEP 1-4 */}
            {currentStep <= 4 && (
              <div className="card shadow-sm border-0">
                <div className="card-body p-4 md:p-5">
                  
                  {/* STEP 1: ROUTE & SERVICE SELECTION */}
                  {currentStep === 1 && (
                    <div>
                      <h3 className="fw-bold mb-4 flex items-center gap-2">
                        <span className="text-primary">📍</span> Chọn Dịch Vụ & Tuyến Đường
                      </h3>

                      {/* Route selector dropdowns */}
                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Điểm Gửi</label>
                          <select
                            className="form-select"
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

                        <div className="col-md-6">
                          <label className="form-label fw-bold">Điểm Nhận</label>
                          <select
                            className="form-select"
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
                      <div className="mb-4">
                        <label className="form-label fw-bold">Ngày Gửi Hàng</label>
                        <input
                          type="date"
                          className="form-control"
                          value={routeData.date}
                          onChange={(e) => setRouteData(prev => ({ ...prev, date: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      {/* Location detail textareas */}
                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Vị Trí Gửi Hàng Chi Tiết <span className="text-danger">*</span></label>
                          <textarea
                            className="form-control"
                            rows="2"
                            maxLength="200"
                            placeholder="VD: 104 Nguyễn Văn Linh, P. Nam Dương, Q. Hải Châu"
                            value={routeData.pickupLocationDetail}
                            onChange={(e) => setRouteData(prev => ({ ...prev, pickupLocationDetail: e.target.value }))}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Vị Trí Nhận Hàng Chi Tiết <span className="text-danger">*</span></label>
                          <textarea
                            className="form-control"
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
                        <div className="pt-3 border-top">
                          {serviceType === 'gui_kem' ? (
                            <>
                              <h5 className="fw-bold text-slate-500 text-xs uppercase mb-3">Danh sách chuyến xe khách phù hợp</h5>
                              {matchedTrips.length === 0 ? (
                                <div className="p-3 border rounded-3 bg-light text-center text-muted text-xs italic">
                                  Không tìm thấy chuyến xe khách nào chạy tuyến này vào ngày đã chọn.
                                </div>
                              ) : (
                                <div className="grid gap-2">
                                  {matchedTrips.map(trip => (
                                    <div
                                      key={trip.id}
                                      className={`p-3 rounded-3 border d-flex justify-content-between align-items-center cursor-pointer transition-all ${selectedTripId === trip.id ? 'border-primary bg-primary bg-opacity-5' : 'bg-white'}`}
                                      onClick={() => setSelectedTripId(trip.id)}
                                    >
                                      <div>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold block mb-1" style={{ width: 'fit-content' }}>Mã CX{trip.id}</span>
                                        <div className="d-flex align-items-center gap-2">
                                          <strong className="text-slate-800 fs-5">{trip.departureTime || trip.time}</strong>
                                          <span className="text-xs text-slate-550">({trip.busType})</span>
                                        </div>
                                        <span className="text-slate-500 text-xs block mt-1">Tài xế chạy tuyến: {trip.driver || 'Đang phân bổ'}</span>
                                      </div>
                                      <div className="text-end">
                                        <span className="text-slate-400 text-[10px] font-bold block">CƯỚC CƠ BẢN</span>
                                        <strong className="text-primary fs-5">{formatVND(trip.price)}</strong>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <h5 className="fw-bold text-slate-500 text-xs uppercase mb-3">Chọn loại xe tải chuyên chở</h5>
                              <div className="grid gap-2">
                                {Object.keys(TRUCK_TYPES).map(key => {
                                  const truck = TRUCK_TYPES[key]
                                  const hasRoute = routeData.from && routeData.to
                                  const distance = hasRoute ? calculateDistance(routeData.from, routeData.to) : 0
                                  const calculatedPrice = hasRoute ? truck.pricePerKm * distance : 0
                                  return (
                                    <div
                                      key={key}
                                      className={`p-3 rounded-3 border d-flex justify-content-between align-items-center cursor-pointer transition-all ${selectedTruckType === key ? 'border-primary bg-primary bg-opacity-5' : 'bg-white'}`}
                                      onClick={() => setSelectedTruckType(key)}
                                    >
                                      <div className="d-flex align-items-center gap-3">
                                        <span className="fs-2">{truck.icon}</span>
                                        <div>
                                          <strong className="text-slate-800 text-sm block">{truck.label}</strong>
                                          <span className="text-[10px] text-slate-500">Khoảng cách dự kiến: {hasRoute ? `~${distance}km` : 'Chưa chọn'}</span>
                                        </div>
                                      </div>
                                      <div className="text-end">
                                        <span className="text-slate-400 text-[10px] font-bold block">CƯỚC BAO XE ({formatVND(truck.pricePerKm)}/km)</span>
                                        <strong className="text-primary fs-5">{hasRoute ? formatVND(calculatedPrice) : '0 đ'}</strong>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                    </div>
                  )}

                  {/* STEP 2: CARGO DECLARATION */}
                  {currentStep === 2 && (
                    <div>
                      <h3 className="fw-bold mb-4 flex items-center gap-2">
                        <span className="text-primary">📦</span> Khai Báo Thông Tin Hàng Hóa
                      </h3>

                      <div className="row g-3 mb-3">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Loại Hàng Hóa</label>
                          <select
                            className="form-select"
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
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Trọng Lượng (KG)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={cargoData.weight}
                            min="0.5"
                            step="0.5"
                            onChange={(e) => setCargoData(prev => ({ ...prev, weight: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="row g-3 mb-4">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Giá Trị Khai Giá (VND) - Để Mua Bảo Hiểm</label>
                          <input
                            type="number"
                            className="form-control"
                            value={cargoData.declaredValue}
                            min="0"
                            step="100000"
                            onChange={(e) => setCargoData(prev => ({ ...prev, declaredValue: e.target.value }))}
                          />
                          <span className="text-[10px] text-slate-500 mt-1 d-block">💡 Phí bảo hiểm hàng hóa bằng 2% giá trị khai giá.</span>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Số Lượng Kiện Hàng <span className="text-danger">*</span></label>
                          <input
                            type="number"
                            className="form-control"
                            value={cargoData.qty}
                            min="1"
                            onChange={(e) => setCargoData(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>

                      {/* Camera Photo Component */}
                      <div className="border bg-light rounded-3 p-4 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <strong className="text-sm text-slate-800 d-block">Hình ảnh kiện hàng thực tế</strong>
                            <span className="text-xs text-slate-550">
                              {parseInt(cargoData.qty) >= 3 ? (
                                <strong className="text-danger">Bắt buộc tải ảnh lên vì số lượng kiện hàng &ge; 3.</strong>
                              ) : (
                                'Khuyến khích đính kèm tối thiểu 1 hình ảnh.'
                              )}
                            </span>
                          </div>
                          <div className="d-flex gap-2">
                            <input
                              type="file"
                              ref={fileInputRef}
                              className="d-none"
                              accept="image/*"
                              multiple
                              onChange={handleFileChange}
                            />
                            <button
                              type="button"
                              className="btn btn-white border text-xs fw-bold px-3 py-2 d-flex align-items-center gap-1.5"
                              onClick={handleUploadClick}
                            >
                              <FiUpload /> Album ảnh
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary text-xs fw-bold px-3 py-2 d-flex align-items-center gap-1.5"
                              onClick={openCamera}
                            >
                              <FiCamera /> Chụp ảnh
                            </button>
                          </div>
                        </div>

                        {/* Warning warning banner */}
                        {parseInt(cargoData.qty) >= 3 && cargoImages.length === 0 && (
                          <div className="alert alert-danger p-2 text-xs mb-3">
                            ⚠️ Đơn hàng có từ 3 kiện trở lên bắt buộc phải đính kèm ảnh kiện hàng thực tế.
                          </div>
                        )}

                        {/* Thumbnails grid */}
                        <div className="d-flex flex-wrap mt-2">
                          {cargoImages.length === 0 ? (
                            <span className="text-slate-400 italic text-xs">Chưa có hình ảnh nào được tải lên</span>
                          ) : (
                            cargoImages.map((src, idx) => (
                              <div key={idx} className="cargo-img-container">
                                <img className="cargo-img-thumbnail" src={src} alt="cargo" />
                                <button
                                  type="button"
                                  className="cargo-img-remove-btn"
                                  onClick={() => removeCargoImage(idx)}
                                >
                                  <FiX />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="form-label fw-bold">Ghi Chú Vận Chuyển</label>
                        <textarea
                          className="form-control"
                          rows="2"
                          placeholder="Ghi chú thêm về kích thước hoặc yêu cầu đặc biệt khi vận chuyển..."
                          value={cargoData.note}
                          onChange={(e) => setCargoData(prev => ({ ...prev, note: e.target.value }))}
                        />
                      </div>

                    </div>
                  )}

                  {/* STEP 3: CONTACT & CCCD */}
                  {currentStep === 3 && (
                    <div>
                      <h3 className="fw-bold mb-4 flex items-center gap-2">
                        <span className="text-primary">👤</span> Xác Minh Danh Tính & Liên Hệ
                      </h3>

                      <div className="mb-4">
                        <h5 className="fw-bold text-primary text-xs uppercase mb-3 border-bottom pb-1">Người gửi</h5>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Họ và Tên</label>
                            <input
                              type="text"
                              className="form-control"
                              value={personData.senderName}
                              onChange={(e) => setPersonData(prev => ({ ...prev, senderName: e.target.value }))}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Số Điện Thoại</label>
                            <input
                              type="tel"
                              className="form-control"
                              value={personData.senderPhone}
                              onChange={(e) => setPersonData(prev => ({ ...prev, senderPhone: e.target.value }))}
                            />
                          </div>
                          <div className="col-md-6 mt-3">
                            <label className="form-label fw-bold">Số CCCD Xác Minh <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Nhập 12 số căn cước công dân"
                              maxLength="12"
                              value={personData.senderCCCD}
                              onChange={(e) => setPersonData(prev => ({ ...prev, senderCCCD: e.target.value.replace(/[^0-9]/g, '') }))}
                            />
                            <span className="text-[10px] text-slate-500 mt-1 d-block">💡 Dùng để ghi nhận pháp lý vào biên bản cam kết hàng hóa.</span>
                          </div>
                          <div className="col-md-6 mt-3">
                            <label className="form-label fw-bold">Email Người Gửi <span className="text-danger">*</span></label>
                            <input
                              type="email"
                              className="form-control"
                              placeholder="VD: customer@busgo.vn"
                              value={personData.senderEmail}
                              onChange={(e) => setPersonData(prev => ({ ...prev, senderEmail: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="fw-bold text-primary text-xs uppercase mb-3 border-bottom pb-1">Người nhận</h5>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Họ và Tên <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Họ tên người nhận"
                              value={personData.receiverName}
                              onChange={(e) => setPersonData(prev => ({ ...prev, receiverName: e.target.value }))}
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold">Số Điện Thoại Nhận <span className="text-danger">*</span></label>
                            <input
                              type="tel"
                              className="form-control"
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
                    <div>
                      <h3 className="fw-bold mb-4 flex items-center gap-2">
                        <span className="text-primary">✍️</span> Ký Xác Nhận Hợp Đồng Vận Chuyển
                      </h3>

                      <div className="alert alert-info d-flex gap-2.5 align-items-start mb-4">
                        <FiInfo size={20} className="mt-0.5 text-primary flex-shrink-0" />
                        <div className="text-xs">
                          <strong>Quy trình gửi hàng an toàn:</strong> Sau khi ký xác nhận và gửi yêu cầu, vui lòng chờ <strong>Tài xế</strong> (xe khách) hoặc <strong>Điều hành</strong> (xe tải) duyệt nhận kiện hàng trước. Sau khi được phê duyệt, bạn mới tiến hành thanh toán tiền cước để nhận biên nhận & gửi hợp đồng về Email.
                        </div>
                      </div>

                      {/* Digital signature canvas box */}
                      <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <label className="form-label fw-bold m-0">Ký Xác Nhận Điện Tử <span className="text-danger">*</span></label>
                          <button
                            type="button"
                            className="btn btn-link text-danger text-xs fw-bold p-0 text-decoration-none"
                            onClick={clearSignature}
                          >
                            Xóa nét vẽ
                          </button>
                        </div>

                        {!signatureImage ? (
                          <div className="border border-slate-200 bg-white rounded-3 overflow-hidden shadow-inner relative" style={{ height: '160px' }}>
                            <canvas
                              ref={canvasRef}
                              className="w-100 h-100"
                              style={{ cursor: 'crosshair' }}
                              onMouseDown={startDrawingMouse}
                              onMouseMove={drawMouse}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              onTouchStart={startDrawingTouch}
                              onTouchMove={drawTouch}
                              onTouchEnd={stopDrawing}
                            />
                            <div className="position-absolute bottom-2 start-2 pointer-events-none text-[10px] text-slate-400 bg-slate-900 bg-opacity-60 px-2 py-0.5 rounded text-white">Vẽ chữ ký của bạn tại đây</div>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm position-absolute bottom-2 end-2 text-[10px] fw-bold"
                              onClick={saveSignature}
                            >
                              Lưu nét ký
                            </button>
                          </div>
                        ) : (
                          <div className="border bg-white rounded-3 p-3 text-center shadow-inner relative" style={{ height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <img className="img-fluid object-fit-contain" style={{ maxHeight: '110px' }} src={signatureImage} alt="saved sig" />
                            <span className="text-success fw-bold text-[10px] block mt-2">✓ Chữ ký điện tử đã được ghi nhận thành công</span>
                          </div>
                        )}
                      </div>

                      {/* Checkboxes terms */}
                      <div className="d-flex flex-column gap-2 mb-2 text-xs">
                        <label className="d-flex items-start gap-2 cursor-pointer text-slate-600">
                          <input
                            type="checkbox"
                            className="form-check-input mt-0.5"
                            checked={eSignatureAccepted}
                            onChange={(e) => setESignatureAccepted(e.target.checked)}
                            disabled={!signatureImage}
                          />
                          <span>Tôi cam đoan thông tin khai báo về hàng hóa là đúng sự thật và tuân thủ các quy định về hàng cấm gửi của BusGo.</span>
                        </label>
                        <label className="d-flex items-start gap-2 cursor-pointer text-slate-600">
                          <input
                            type="checkbox"
                            className="form-check-input mt-0.5"
                            checked={eConsignmentAccepted}
                            onChange={(e) => setEConsignmentAccepted(e.target.checked)}
                          />
                          <span>Tôi đồng ý sử dụng chữ ký điện tử trên làm căn cứ pháp lý để lập vận đơn gửi hàng này.</span>
                        </label>
                      </div>

                    </div>
                  )}

                  {/* Bottom Step Buttons */}
                  <div className="d-flex justify-content-between align-items-center pt-4 border-top mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4 py-2 text-sm"
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
                        className="btn btn-primary px-4 py-2 text-sm d-flex align-items-center gap-1.5"
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
                        Tiếp tục <FiArrowRight />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-orange text-white px-4 py-2 text-sm d-flex align-items-center gap-1.5 border-0"
                        style={{ backgroundColor: '#f97316' }}
                        disabled={confirmLoading || !isStep4Complete}
                        onClick={handleRequestSubmit}
                      >
                        {confirmLoading ? '⏳ Đang lưu...' : 'Gửi yêu cầu vận chuyển'}
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* STEP 5: WAITING FOR APPROVAL & PAYMENT */}
            {currentStep === 5 && (
              <div className="card shadow-sm border-0">
                <div className="card-body p-4 md:p-5 text-center">
                  
                  {/* Status 1: Waiting */}
                  {(consignmentStatus === 'dang_cho_xac_nhan' || consignmentStatus === 'dang_tim_xe_trong') && (
                    <div className="py-5">
                      <div className="spinner-border text-primary mb-4" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <h3 className="fw-black text-slate-800 fs-4 mb-2">Đang Chờ Phê Duyệt Nhận Hàng</h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto mb-4 leading-relaxed">
                        Yêu cầu gửi hàng của bạn đã gửi đi thành công với mã <strong>{activeConsignmentId}</strong>. 
                        Vui lòng chờ tài xế xác nhận nhận hàng trực tuyến trước khi thanh toán.
                      </p>
                      <div className="alert alert-warning text-xs max-w-sm mx-auto mb-3">
                        💡 **Để thử nghiệm nhanh**: Hãy mở file <strong>driver.html</strong> (nếu gửi xe khách) hoặc <strong>support.html</strong> (nếu thuê xe tải) ở tab khác và bấm **Duyệt nhận** đơn hàng này.
                      </div>
                      <button 
                        className="btn btn-outline-danger btn-sm text-xs font-bold px-4 mt-2"
                        onClick={handleCancelConsignment}
                      >
                        Hủy yêu cầu
                      </button>
                    </div>
                  )}

                  {/* Status 2: Rejected or Cancelled */}
                  {(consignmentStatus === 'failed' || consignmentStatus === 'da_huy') && (
                    <div className="py-5">
                      <span className="fs-1 text-danger block mb-3">❌</span>
                      <h3 className="fw-black text-slate-800 fs-4 mb-2">{consignmentStatus === 'da_huy' ? 'Đơn Đã Hủy' : 'Đơn Hàng Bị Từ Chối'}</h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
                        {consignmentStatus === 'da_huy' 
                          ? 'Bạn đã hủy yêu cầu vận chuyển đơn hàng này.' 
                          : 'Rất tiếc, tài xế hoặc trạm điều hành đã từ chối nhận vận chuyển đơn hàng này.'}
                      </p>
                      <button onClick={resetForm} className="btn btn-primary px-4 py-2 text-xs">
                        Tạo yêu cầu mới
                      </button>
                    </div>
                  )}

                  {/* Status 3: Approved -> NEEDS PAYMENT */}
                  {consignmentStatus === 'da_xac_nhan' && (
                    <div className="py-4 text-start">
                      <div className="alert alert-success d-flex gap-3 align-items-center mb-4">
                        <FiCheckCircle size={32} className="text-success flex-shrink-0" />
                        <div>
                          <strong className="text-success d-block text-sm">Yêu cầu của bạn đã được chấp nhận!</strong>
                          <span className="text-xs text-slate-650 mt-0.5 block">
                            Tài xế/Xe tải: <strong>{assignedDriverInfo || 'Đã phân bổ'}</strong>
                          </span>
                        </div>
                      </div>

                      <h4 className="fw-bold text-slate-800 mb-3 fs-5">💳 Thanh Toán Cước Vận Chuyển</h4>
                      
                      {/* Payment Choice */}
                      <div className="mb-4">
                        <label className="form-label text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phương thức thanh toán</label>
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className={`p-3 rounded-3 border w-100 d-flex align-items-center gap-2.5 cursor-pointer ${selectedPaymentMethod === 'momo' ? 'border-primary bg-primary bg-opacity-5' : 'bg-white'}`}>
                              <input
                                type="radio"
                                name="pay-waiting"
                                value="momo"
                                checked={selectedPaymentMethod === 'momo'}
                                onChange={() => setSelectedPaymentMethod('momo')}
                              />
                              <div>
                                <strong className="text-slate-800 text-xs block">📱 Ví Điện Tử MoMo</strong>
                                <span className="text-[10px] text-slate-500">Trả qua app MoMo</span>
                              </div>
                            </label>
                          </div>
                          <div className="col-md-6">
                            <label className={`p-3 rounded-3 border w-100 d-flex align-items-center gap-2.5 cursor-pointer ${selectedPaymentMethod === 'visa' ? 'border-primary bg-primary bg-opacity-5' : 'bg-white'}`}>
                              <input
                                type="radio"
                                name="pay-waiting"
                                value="visa"
                                checked={selectedPaymentMethod === 'visa'}
                                onChange={() => setSelectedPaymentMethod('visa')}
                              />
                              <div>
                                <strong className="text-slate-800 text-xs block">💳 Thẻ Visa/Mastercard</strong>
                                <span className="text-[10px] text-slate-500">Cổng thanh toán thẻ quốc tế</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Pay button */}
                      <div className="pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                          <span className="text-slate-400 text-[10px] font-bold block uppercase tracking-wider">Tổng số tiền cần thanh toán</span>
                          <strong className="text-success fs-4 fw-black">{formatVND(getTotalPrice())}</strong>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-danger px-3 py-2.5 font-bold text-xs"
                            onClick={handleCancelConsignment}
                            disabled={paymentLoading}
                          >
                            Hủy Đơn
                          </button>
                          <button
                            type="button"
                            className="btn btn-success px-5 py-2.5 font-bold text-xs d-flex align-items-center gap-2"
                            disabled={paymentLoading}
                            onClick={handlePaymentConfirm}
                          >
                            {paymentLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm" role="status"></span>
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


                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

          {/* Right panel: Summary sidebar */}
          <div className="col-lg-4">
            <div className="card shadow-sm border-0 bg-light sticky-top" style={{ top: '80px', zIndex: '10' }}>
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 border-bottom pb-2">TÓM TẮT ĐƠN GỬI</h5>

                <div className="d-flex flex-column gap-3 text-xs text-slate-650">
                  <div>
                    <span className="text-muted block">Dịch vụ chọn</span>
                    <strong className="text-slate-800">
                      {serviceType === 'gui_kem' ? 'Gửi kèm xe khách (Type 1)' : 'Thuê xe vận tải riêng (Type 2)'}
                    </strong>
                  </div>

                  {routeData.from && routeData.to && routeData.date && (
                    <div>
                      <span className="text-muted block">Tuyến hành trình</span>
                      <strong className="text-slate-800 fs-6 block mt-0.5">{routeData.from} ➔ {routeData.to}</strong>
                      <span className="text-slate-500 d-block mt-0.5">Ngày gửi: {new Date(routeData.date).toLocaleDateString('vi-VN')}</span>
                      
                      {serviceType === 'gui_kem' ? (
                        <span className="text-primary fw-bold block mt-1">
                          Chuyến: {selectedTripId ? (matchedTrips.find(t => t.id === selectedTripId)?.departureTime || matchedTrips.find(t => t.id === selectedTripId)?.time || 'Chưa chọn') : 'Chưa chọn chuyến'}
                        </span>
                      ) : (
                        <span className="text-primary fw-bold block mt-1">
                          Xe thuê: {TRUCK_TYPES[selectedTruckType]?.label}
                        </span>
                      )}
                    </div>
                  )}

                  <div>
                    <span className="text-muted block">Thông tin hàng hóa</span>
                    <strong className="text-slate-850">
                      {cargoData.type ? CARGO_TYPES[cargoData.type]?.label : 'Chưa khai báo'} ({cargoData.weight}kg)
                    </strong>
                    <span className="text-slate-500 block mt-0.5">Số lượng: {cargoData.qty} kiện • {cargoImages.length} ảnh đính kèm</span>
                  </div>

                  {personData.senderCCCD && (
                    <div>
                      <span className="text-muted block">Người gửi (Danh tính)</span>
                      <strong className="text-slate-800">{personData.senderName}</strong>
                      <span className="text-slate-500 d-block">CCCD: {personData.senderCCCD}</span>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <>
                      <hr className="my-1 border-slate-200" />
                      <div>
                        <span className="text-muted block">Thông tin vận chuyển</span>
                        {assignedDriverInfo ? (
                          <div className="mt-1 bg-green-50 p-2 rounded border border-green-100">
                            <strong className="text-success d-block text-[11px]">✓ Đã gán tài xế</strong>
                            <span className="text-slate-700 font-semibold">{assignedDriverInfo}</span>
                          </div>
                        ) : serviceType === 'gui_kem' ? (
                          <div className="mt-1 bg-slate-100 p-2 rounded border border-slate-200">
                            <strong className="text-slate-700 d-block text-[11px]">Chuyến xe: {selectedTripId ? (matchedTrips.find(t => t.id === selectedTripId)?.departureTime || matchedTrips.find(t => t.id === selectedTripId)?.time) : ''}</strong>
                            <span className="text-slate-650">Tài xế dự kiến: {matchedTrips.find(t => t.id === selectedTripId)?.driver || 'Đang phân bổ'} (Chờ xác nhận)</span>
                          </div>
                        ) : (
                          <div className="mt-1 bg-blue-50 p-2 rounded border border-blue-100 animate-pulse">
                            <strong className="text-blue-700 d-block text-[11px]">⏳ Đang tìm xe tải</strong>
                            <span className="text-slate-500">Chờ điều phối trạm điều hành</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <hr className="my-1 border-slate-200" />

                  <div className="space-y-2">
                    <div className="d-flex justify-content-between">
                      <span>Cước vận chuyển:</span>
                      <strong className="text-slate-800">{formatVND(getCargoPrice())}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Bảo hiểm khai giá:</span>
                      <strong className="text-slate-800">{formatVND(getInsurancePrice())}</strong>
                    </div>
                    <hr className="my-2 border-dashed" />
                    <div className="d-flex justify-content-between text-sm">
                      <strong className="text-slate-900">Tổng thanh toán:</strong>
                      <strong className="text-primary fs-5 fw-black">{formatVND(getTotalPrice())}</strong>
                    </div>
                  </div>
                </div>

                {currentStep === 5 && !isConfirmed && (
                  <div className="mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-danger w-100 py-2.5 font-bold text-xs d-flex align-items-center justify-content-center gap-1.5"
                      onClick={handleCancelRequest}
                    >
                      ❌ Hủy yêu cầu gửi hàng
                    </button>
                  </div>
                )}

                {/* QR code block */}
                {currentStep === 4 && (
                  <div className="border bg-white rounded-3 p-3 text-center mt-4 shadow-sm">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">QR Code vận đơn</span>
                    <div className="d-flex justify-content-center">
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
                        size={150}
                        level="H"
                        includeMargin={true}
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
        <div className="camera-modal-overlay">
          <div className="camera-modal-content">
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
              <strong className="text-xs text-slate-800 uppercase">Chụp ảnh kiện hàng thực tế</strong>
              <button className="btn-close" onClick={closeCamera}></button>
            </div>
            
            <div className="camera-video-container">
              <video ref={videoRef} className="w-100 h-100 object-fit-cover" autoplay playsinline></video>
              
              {showMockCamera && (
                <div className="camera-mock-overlay">
                  <span className="fs-1 mb-2">📷</span>
                  <strong className="text-slate-800 text-sm block">Không có webcam kết nối</strong>
                  <span className="text-slate-500 text-xs block max-w-xs mt-1">Trình duyệt không tìm thấy camera vật lý hoặc quyền truy cập bị từ chối. Hệ thống sẽ tự động tạo ảnh chụp mẫu.</span>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm mt-3 fw-bold"
                    onClick={captureMockPhoto}
                  >
                    Sử dụng ảnh mô phỏng
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 bg-light border-top d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={closeCamera}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm d-flex align-items-center gap-1.5"
                onClick={capturePhoto}
              >
                <span>📸</span> Chụp ảnh ngay
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

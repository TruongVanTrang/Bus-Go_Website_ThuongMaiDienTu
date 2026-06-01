// 1. Lấy useState và useEffect từ 'react'
import { useState, useEffect } from 'react'

// 2. Lấy các hook điều hướng từ 'react-router-dom'
import { useLocation, useParams, useNavigate } from "react-router-dom"

// 3. Các thư viện icon và component, CSS giữ nguyên
import { FiDownload, FiPrinter, FiShare2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import TicketCard from '../../components/ticket/TicketCard'
import Stepper from '../../components/common/Stepper'
import { getTicketDetailAPI } from '../../services/bookingService'
import { StorageUtil } from '../../utils/helpers'
import './ETicketPage.css'

export default function ETicketPage() {
  const { bookingId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [verifying, setVerifying] = useState(true)

  // Check payment status on component mount
  useEffect(() => {
    // In a real app, this would be an API call to verify payment status
    if (state?.paymentStatus === 'Da thanh toan') {
      setPaymentVerified(true)
    }
    
    // Simulate payment verification delay
    const timer = setTimeout(() => {
      setVerifying(false)
      if (!state?.paymentStatus || state?.paymentStatus !== 'Da thanh toan') {
        // Payment not verified, redirect to payment page
        navigate('/payment', { state })
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [state, navigate])

  const [ticketData, setTicketData] = useState(state?.trip ? state : null)

  useEffect(() => {
    // If ticket data is not in state (e.g. accessed directly or returned from VNPay without full state)
    if (!ticketData && bookingId) {
      const fetchTicket = async () => {
        try {
          const token = StorageUtil.getToken()
          if (token) {
            const data = await getTicketDetailAPI(token, bookingId)
            setTicketData(data)
            if (data.paymentStatus === 'Da thanh toan') {
              setPaymentVerified(true)
            }
          }
        } catch (error) {
          console.error("Failed to fetch ticket data", error)
        }
      }
      fetchTicket()
    }
  }, [bookingId, ticketData])

  const handleDownload = () => {
    const canvas = document.querySelector('.ticket-qr canvas')
    
    if (canvas) {
      const url = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = url
      link.download = `ticket-${bookingId}.png`
      link.click()
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BusGo Ticket',
          text: `Vé xe bus từ ${ticketData.trip.from} đến ${ticketData.trip.to}`,
          url: window.location.href
        })
      } catch (err) {
        console.log('Share cancelled:', err)
      }
    } else {
      // Fallback: Copy booking ID to clipboard
      navigator.clipboard.writeText(bookingId)
      alert('Mã đặt chỗ đã được sao chép!')
    }
  }

  if (verifying || !ticketData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <h5 className="text-xl font-bold text-slate-900 mb-2">Đang xác thực và tải vé...</h5>
          <p className="text-slate-500 font-medium">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    )
  }

  if (!paymentVerified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-fade-in-up">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="text-red-500" size={40} />
          </div>
          <h5 className="text-xl font-bold text-slate-900 mb-3">Thanh toán chưa xác nhận</h5>
          <p className="text-slate-500 font-medium mb-8">
            Vé của bạn chưa được kích hoạt. Vui lòng hoàn tất thanh toán để nhận vé điện tử.
          </p>
          <button
            onClick={() => navigate('/payment', { state })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors"
          >
            Tiếp tục thanh toán
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* =========================================================
          STYLE IN ẤN: CHO PHÉP IN VÉ + HƯỚNG DẪN 3 BƯỚC
      ========================================================== */}
      <style media="print">{`
        @page {
          size: auto;
          margin: 10mm 15mm;
        }
        
        html, body, #root, .min-h-screen {
          height: auto !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          background-color: white !important;
        }

        /* Ẩn tất cả các phần không cần in */
        .print-hide,
        button,
        header, 
        nav, 
        footer {
          display: none !important;
        }

        /* Chỉ hiển thị vé */
        .print-show {
          display: block !important; 
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        .ticket-card-wrapper {
          display: block !important;
          width: 100% !important;
          max-width: 650px !important;
          margin: 0 auto !important;
          page-break-before: avoid !important;
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        .ticket-card {
          box-shadow: none !important;
          border: 2px solid #000 !important;
        }
      `}</style>
      {/* ========================================================= */}

      {/* Stepper */}
      <div className="print-hide">
        <Stepper currentStep={3} steps={[]} />
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 md:px-16 pt-8 print-show">
        {/* Success Message */}
        <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8 print-hide">
          <div className="shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
            <FiCheckCircle size={28} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-lg font-black text-emerald-900 mb-1">Thanh toán thành công - Vé đã kích hoạt!</div>
            <div className="text-emerald-700 font-medium">Mã đặt chỗ: <strong className="text-emerald-900">{bookingId}</strong></div>
          </div>
        </div>

        {/* Main Ticket + Actions Layout */}
        <div className="flex flex-col xl:flex-row gap-8 mb-8">
          {/* Main Ticket - 70% */}
          <div className="xl:col-span-2 flex-grow print-show">
            <TicketCard bookingId={bookingId} ticketData={ticketData} />
          </div>

          {/* Action Sidebar - 30% */}
          <div className="xl:w-[400px] shrink-0 print-hide">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h5 className="text-xl font-bold text-slate-900 mb-6">Thao tác với vé</h5>

              <div className="space-y-4">
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  <FiDownload size={20} />
                  Tải vé
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-blue-600 font-bold py-3.5 rounded-xl border-2 border-blue-600 transition-all"
                >
                  <FiPrinter size={20} />
                  In vé
                </button>

                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-600 font-bold py-3.5 rounded-xl border border-slate-300 transition-all"
                >
                  <FiShare2 size={20} />
                  Chia sẻ
                </button>
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <FiAlertCircle className="text-blue-600" />
                  Hướng dẫn quan trọng:
                </div>
                <ul className="space-y-2 text-sm text-blue-800 font-medium pl-6 list-disc">
                  <li>Lưu mã QR trên điện thoại</li>
                  <li>Xuất trình vé trước 30 phút</li>
                  <li>Mang theo CMND khi lên xe</li>
                  <li>Kiểm tra thời gian khởi hành</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps - HƯỚNG DẪN ĐƯỢC IN KÈM THEO VÉ */}
        <div className="flex flex-col xl:flex-row gap-8 print-hide">
          <div className="xl:col-span-2 flex-grow">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h5 className="text-xl font-bold text-slate-900 mb-8">Quy trình tiếp theo</h5>

              {/* Lưới 3 cột ngang */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Bước 1 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-black mb-4 shadow-sm border-2 border-blue-200">1</div>
                  <div className="text-lg font-bold text-slate-900 mb-2">Lưu hoặc in vé</div>
                  <p className="text-slate-500 font-medium text-sm">
                    Lưu vé trên điện thoại hoặc in vé từ bây giờ. Bạn có thể lấy bất cứ lúc nào trước chuyến xe.
                  </p>
                </div>

                {/* Bước 2 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-black mb-4 shadow-sm border-2 border-blue-200">2</div>
                  <div className="text-lg font-bold text-slate-900 mb-2">Xuất trình tại quầy</div>
                  <p className="text-slate-500 font-medium text-sm">
                    Đến bến xe 30 phút trước giờ khởi hành. Xuất trình mã QR hoặc vé in tại quầy làm thủ tục.
                  </p>
                </div>

                {/* Bước 3 */}
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-black mb-4 shadow-sm border-2 border-blue-200">3</div>
                  <div className="text-lg font-bold text-slate-900 mb-2">Lên xe</div>
                  <p className="text-slate-500 font-medium text-sm">
                    Mang theo CMND/Hộ chiếu để xác nhận và lên xe. Ghế đã được đặt sẵn cho bạn.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:w-[400px] shrink-0">
            {/* Back to Home Button */}
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-md mb-4"
            >
              ← Quay về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

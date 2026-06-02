import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'
import { StorageUtil } from '../../utils/helpers'
import { cancelBookingAPI } from '../../services/bookingService'

export default function VNPayReturnPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')
  const [bookingId, setBookingId] = useState('')

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const params = Object.fromEntries(searchParams.entries())
    
    if (params && params.vnp_ResponseCode) {
      setBookingId(params.vnp_TxnRef)
      if (params.vnp_ResponseCode === '00') {
        setStatus('success')
        
        // Cú hack cho Localhost: Vì VNPay không thể gọi webhook (IPN) về localhost, 
        // ta tự động gọi IPN thủ công bằng fetch để Backend có thể gửi Email và cập nhật DB.
        if (window.location.hostname === 'localhost') {
           fetch(`http://localhost:5000/api/payments/vnpay/ipn${location.search}`).catch(console.error);
        }

        // Auto redirect after 3 seconds
        setTimeout(() => {
          const pendingBookingStr = sessionStorage.getItem('pendingVNPayBooking')
          let stateData = { paymentStatus: 'Da thanh toan', paymentMethod: 'vnpay' }
          
          if (pendingBookingStr) {
            try {
              const pendingBooking = JSON.parse(pendingBookingStr)
              stateData = { ...pendingBooking, paymentStatus: 'Da thanh toan' }
              sessionStorage.removeItem('pendingVNPayBooking')
            } catch (e) {
              console.error(e)
            }
          }
          navigate(`/ticket/${params.vnp_TxnRef}`, { state: stateData })
        }, 3000)
      } else {
        setStatus('error')
        // Hủy đơn hàng để nhả ghế nếu thanh toán thất bại
        const token = StorageUtil.getToken()
        if (token && params.vnp_TxnRef) {
          cancelBookingAPI(token, params.vnp_TxnRef)
            .then(() => {
              sessionStorage.removeItem('pendingVNPayBooking')
            })
            .catch(console.error)
        }
      }
    } else {
      setStatus('invalid')
    }
  }, [location.search, navigate])

  const handleViewTicket = () => {
    const pendingBookingStr = sessionStorage.getItem('pendingVNPayBooking')
    let stateData = { paymentStatus: 'Da thanh toan', paymentMethod: 'vnpay' }
    if (pendingBookingStr) {
      try {
        const pendingBooking = JSON.parse(pendingBookingStr)
        stateData = { ...pendingBooking, paymentStatus: 'Da thanh toan' }
      } catch (e) {}
    }
    navigate(`/ticket/${bookingId}`, { state: stateData })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center">
        
        {status === 'processing' && (
          <div className="py-8">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-xl font-black text-slate-900 mb-2">Đang xử lý kết quả...</h2>
            <p className="text-slate-500 font-medium">Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="text-emerald-500" size={52} />
            </div>
            <h2 className="text-2xl font-black text-emerald-600 mb-2">Thanh toán thành công!</h2>
            <p className="text-slate-600 font-medium mb-6">
              Mã đơn hàng: <strong className="text-slate-900">{bookingId}</strong>
            </p>
            <div className="bg-blue-50 text-blue-700 text-sm font-bold py-3 px-4 rounded-xl mb-6">
              Hệ thống sẽ tự động chuyển đến vé của bạn trong giây lát...
            </div>
            <button 
              onClick={handleViewTicket}
              className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-4 rounded-xl transition-colors shadow-md hover:shadow-lg"
            >
              Xem vé ngay
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiXCircle className="text-red-500" size={52} />
            </div>
            <h2 className="text-2xl font-black text-red-600 mb-2">Thanh toán thất bại</h2>
            <p className="text-slate-600 font-medium mb-8">
              Giao dịch cho đơn hàng <strong className="text-slate-900">{bookingId}</strong> không thành công hoặc đã bị hủy.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => navigate('/')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors"
              >
                Về trang chủ
              </button>
              <button 
                onClick={() => navigate('/search')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-colors"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {status === 'invalid' && (
          <div className="py-4">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="text-amber-500" size={52} />
            </div>
            <h2 className="text-2xl font-black text-amber-600 mb-2">Yêu cầu không hợp lệ</h2>
            <p className="text-slate-600 font-medium mb-8">
              Không tìm thấy thông tin giao dịch từ VNPay.
            </p>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl shadow-md transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

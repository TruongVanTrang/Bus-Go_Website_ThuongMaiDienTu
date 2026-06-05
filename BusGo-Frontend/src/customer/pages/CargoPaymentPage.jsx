import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FiCheckCircle, FiClock, FiLock, FiArrowLeft, FiShield, FiPackage, FiTruck, FiCheck } from 'react-icons/fi'
import QRCode from 'qrcode.react'
import { StorageUtil } from '../../utils/helpers'
import { createVNPayUrlAPI } from '../../services/bookingService'

const PAYMENT_METHODS = {
  bank_transfer: {
    name: 'Chuyển khoản ngân hàng',
    category: 'Chuyển khoản',
    logo: '🏦',
    description: 'Quét mã VietQR để thanh toán nhanh chóng',
    badge: 'Phổ biến'
  },
  vnpay: {
    name: 'VNPay',
    category: 'Ví điện tử',
    logo: '📱',
    description: 'Thanh toán qua cổng VNPay an toàn, tiện lợi',
    badge: null
  }
}

export default function CargoPaymentPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { state } = location
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [confirmLoading, setConfirmLoading] = useState(false)

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer')

  const cargoData = state?.activeConsignment || {
    id: 'CSM_SAMPLE',
    tongTien: 0,
    loaiHangHoa: 'documents',
    diemGui: '',
    diemNhan: '',
    soLuong: 1,
    trongLuong: 1
  }

  const consignmentId = cargoData.id || state?.activeConsignmentId
  const totalAmount = cargoData.tongTien || 0

  const qrCodeContent = JSON.stringify({
    consignmentId,
    amount: totalAmount,
    merchant: 'BusGo Cargo',
    method: selectedPaymentMethod,
    description: `Payment for cargo ${consignmentId}`
  })

  const handleConfirmPayment = async () => {
    if (selectedPaymentMethod === 'none') {
      alert('Vui lòng chọn phương thức thanh toán')
      return
    }
    const token = StorageUtil.getToken()
    if (!token) {
      alert('Bạn cần đăng nhập để thực hiện thanh toán!')
      navigate('/login')
      return
    }

    setConfirmLoading(true)
    try {
      if (selectedPaymentMethod === 'vnpay') {
        const vnpayRes = await createVNPayUrlAPI(totalAmount, consignmentId)
        if (vnpayRes?.url) {
          window.location.href = vnpayRes.url
          return
        }
      } else {
        // Bank transfer - call API directly
        const response = await fetch(`http://localhost:5000/api/cargo/consignment/${consignmentId}/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ paymentMethod: selectedPaymentMethod })
        })

        if (!response.ok) {
          throw new Error('Lỗi thanh toán ngân hàng')
        }
      }

      setConfirmLoading(false)
      setIsConfirmed(true)
      setTimeout(() => {
        // Return to history page showing the cargo tracking
        navigate('/history', { state: { defaultTab: 'cargo' } })
      }, 2000)
    } catch (error) {
      setConfirmLoading(false)
      alert(error.message || 'Có lỗi xảy ra khi thanh toán. Vui lòng thử lại.')
    }
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="text-green-500" size={52} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Thanh toán thành công!</h2>
          <p className="text-slate-500 font-medium mb-8">
            Hệ thống đang xác nhận và chuẩn bị biên nhận ký gửi của bạn...
          </p>
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-8 md:px-16">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
            Quay lại
          </button>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-slate-900">Thanh toán Ký gửi Hàng hóa</h1>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã vận đơn</div>
              <div className="text-sm font-black text-blue-600">{consignmentId}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FiPackage className="text-blue-500" /> Thông tin Đơn hàng Ký gửi
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-2xl font-black text-slate-900">{cargoData.diemGui}</div>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <div className="text-xs font-bold">🚚 Tuyến</div>
                    <div className="w-24 h-px bg-slate-200 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-slate-900">{cargoData.diemNhan}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">Loại hàng</div>
                    <div className="text-sm font-bold text-slate-800 capitalize">{cargoData.loaiHangHoa}</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">Trọng lượng</div>
                    <div className="text-sm font-bold text-slate-800">{cargoData.trongLuong} kg</div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <div className="text-xs font-bold text-slate-400 mb-1">Số lượng</div>
                    <div className="text-sm font-bold text-slate-800">{cargoData.soLuong} kiện</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-indigo-100 bg-indigo-100/60">
                <h2 className="text-base font-bold text-indigo-900 flex items-center gap-2">
                  <FiLock className="text-indigo-500" /> Chọn phương thức thanh toán
                </h2>
              </div>
              <div className="p-6 space-y-3">
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPaymentMethod === key
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={key}
                      checked={selectedPaymentMethod === key}
                      onChange={() => setSelectedPaymentMethod(key)}
                      className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-2xl">{method.logo}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{method.name}</span>
                        {method.badge && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 bg-green-100 text-green-700 rounded-full uppercase tracking-wider">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">{method.description}</div>
                    </div>
                    {selectedPaymentMethod === key && (
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shrink-0">
                        <FiCheck size={14} />
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiShield className="text-green-500" size={18} />
                <h3 className="font-bold text-slate-800">Bảo mật thanh toán</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: '🔐', title: 'Chứng chỉ SSL', desc: 'Mã hóa 256-bit' },
                  { icon: '🏅', title: 'PCI DSS', desc: 'Tiêu chuẩn v3.2' },
                  { icon: '🛡️', title: 'Bảo mật tuyệt đối', desc: 'Thông tin được mã hóa' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-green-50 rounded-xl p-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{item.title}</div>
                      <div className="text-xs text-slate-500">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 space-y-4">
              <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-amber-100 bg-amber-100/60">
                  <h2 className="text-base font-bold text-amber-900">Tóm tắt thanh toán</h2>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-900">Tổng thanh toán</span>
                    <span className="text-2xl font-black text-blue-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col items-center">
                  <div className="text-sm font-bold text-slate-600 mb-4 text-center">
                    Quét mã để thanh toán qua <span className="text-blue-600">{PAYMENT_METHODS[selectedPaymentMethod]?.name}</span>
                  </div>

                  <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                    {selectedPaymentMethod === 'bank_transfer' ? (
                      <img
                        src={`https://img.vietqr.io/image/BIDV-5811675947-compact2.png?amount=${totalAmount}&addInfo=${consignmentId}&accountName=BUSGO`}
                        alt="VietQR"
                        className="w-48 h-48 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'inline-block'
                        }}
                      />
                    ) : null}
                    <div 
                      className="bg-white p-4 rounded-xl border border-slate-200"
                      style={{ display: selectedPaymentMethod !== 'bank_transfer' ? 'inline-block' : 'none' }}
                    >
                      <QRCode
                        value={qrCodeContent}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleConfirmPayment}
                  disabled={confirmLoading}
                  className={`mt-6 w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                    confirmLoading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                  }`}
                >
                  {confirmLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </>
                  ) : selectedPaymentMethod === 'vnpay' ? (
                    <><FiCheck /> Thanh toán qua VNPay</>
                  ) : (
                    <><FiCheck /> Xác nhận đã chuyển khoản</>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 font-medium mt-3">
                  🔒 Giao dịch được bảo mật bởi SSL 256-bit
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

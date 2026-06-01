import { FiTruck, FiCreditCard, FiShield, FiClock, FiHeadphones, FiTrendingUp } from 'react-icons/fi'
import { Card, CardBody } from '@nextui-org/react'

const features = [
  { icon: <FiTruck size={26} />, title: 'Hàng ngàn chuyến', description: 'Lựa chọn từ hơn 10,000 chuyến xe mỗi ngày trên toàn quốc', accent: 'bg-white/15' },
  { icon: <FiCreditCard size={26} />, title: 'Giá tốt nhất', description: 'Cam kết giá cạnh tranh nhất với nhiều hình thức thanh toán', accent: 'bg-white/15' },
  { icon: <FiShield size={26} />, title: 'An toàn & Tin cậy', description: 'Tất cả xe được kiểm tra chất lượng và bảo hiểm định kỳ', accent: 'bg-white/15' },
  { icon: <FiClock size={26} />, title: 'Đặt vé nhanh', description: 'Quy trình đặt vé đơn giản, hoàn tất chỉ trong 3 phút', accent: 'bg-white/15' },
  { icon: <FiHeadphones size={26} />, title: 'Hỗ trợ 24/7', description: 'Đội ngũ chăm sóc khách hàng luôn sẵn sàng hỗ trợ bạn', accent: 'bg-white/15' },
  { icon: <FiTrendingUp size={26} />, title: 'Ưu đãi thường xuyên', description: 'Nhận khuyến mãi độc quyền và tích điểm thưởng hàng tháng', accent: 'bg-white/15' },
]

export default function Features() {
  return (
    <div>
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 bg-white/15 border border-white/20 rounded-full text-blue-200 text-sm font-semibold mb-4">
          Tại sao chọn BusGo?
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          Trải nghiệm đặt vé{' '}
          <span className="text-blue-200">đỉnh cao</span>
        </h2>
        <p className="text-blue-200/60 mt-4 text-base max-w-xl mx-auto">
          Chúng tôi liên tục cải tiến để mang đến dịch vụ tốt nhất cho bạn
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group flex items-start gap-4 p-5 rounded-2xl
                       bg-white/8 hover:bg-white/15 border border-white/10
                       hover:border-white/20 transition-all duration-300"
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/15
                            flex items-center justify-center text-white
                            group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">{feature.title}</h4>
              <p className="text-blue-200/60 text-xs leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

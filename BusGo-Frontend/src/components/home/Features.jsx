import { FiTruck, FiCreditCard, FiShield, FiClock, FiHeadphones, FiTrendingUp } from 'react-icons/fi'

export default function Features() {
  const features = [
    {
      icon: <FiTruck size={28} />,
      title: 'Hàng ngàn chuyến',
      description: 'Lựa chọn từ hơn 10,000 chuyến xe khởi hành mỗi ngày.'
    },
    {
      icon: <FiCreditCard size={28} />,
      title: 'Giá tốt nhất',
      description: 'Giá cước cạnh tranh với nhiều ưu đãi thanh toán linh hoạt.'
    },
    {
      icon: <FiShield size={28} />,
      title: 'An toàn & Tin cậy',
      description: 'Đội ngũ xe chất lượng cao được kiểm định định kỳ.'
    },
    {
      icon: <FiClock size={28} />,
      title: 'Đặt vé nhanh',
      description: 'Hoàn tất quy trình đặt vé và giữ chỗ chỉ trong 3 phút.'
    },
    {
      icon: <FiHeadphones size={28} />,
      title: 'Hỗ trợ 24/7',
      description: 'Tổng đài chăm sóc khách hàng luôn sẵn sàng phục vụ bạn.'
    },
    {
      icon: <FiTrendingUp size={28} />,
      title: 'Khuyến mãi thường xuyên',
      description: 'Hàng ngàn mã giảm giá và voucher quà tặng mỗi tháng.'
    }
  ]

  return (
    <div className="w-full bg-[#f8fafc] py-16 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2">Giá trị vượt trội</span>
          <h2 className="text-3xl font-black text-[#0c3d66] mb-3">
            Tại sao chọn BusGo?
          </h2>
          <p className="text-slate-400 font-semibold text-sm max-w-lg mx-auto">
            Trải nghiệm đặt vé xe bus thông minh hàng đầu. Nhanh chóng, an toàn và tối ưu chi phí cho hành trình của bạn.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-[28px] p-8 border border-slate-200/60 hover:border-blue-200/80 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1.5 transition-all duration-350 group cursor-default relative overflow-hidden flex flex-col justify-between"
            >
              {/* Expanding top accent bar on hover */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-300 z-20"></div>

              <div className="relative z-10 text-left">
                {/* Blue Icon container with micro-animations */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-650 bg-blue-50 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-sm">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-extrabold text-slate-800 mb-3">{feature.title}</h4>
                <p className="text-slate-405 font-semibold text-xs leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

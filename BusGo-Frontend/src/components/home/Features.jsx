import { FiTruck, FiCreditCard, FiShield, FiClock, FiHeadphones, FiTrendingUp } from 'react-icons/fi'

export default function Features() {
  const features = [
    {
      icon: <FiTruck size={32} />,
      title: 'Hàng ngàn chuyến',
      description: 'Lựa chọn từ hơn 10,000 chuyến xe mỗi ngày',
      color: 'from-blue-400 to-blue-600'
    },
    {
      icon: <FiCreditCard size={32} />,
      title: 'Giá tốt nhất',
      description: 'Giá cạnh tranh với nhiều hình thức thanh toán',
      color: 'from-indigo-400 to-indigo-600'
    },
    {
      icon: <FiShield size={32} />,
      title: 'An toàn & Tin cậy',
      description: 'Các xe được kiểm tra chất lượng định kỳ',
      color: 'from-emerald-400 to-emerald-600'
    },
    {
      icon: <FiClock size={32} />,
      title: 'Đặt vé nhanh',
      description: 'Quy trình đặt vé chỉ mất 3 phút',
      color: 'from-amber-400 to-amber-600'
    },
    {
      icon: <FiHeadphones size={32} />,
      title: 'Hỗ trợ 24/7',
      description: 'Đội hỗ trợ khách hàng luôn sẵn sàng giúp',
      color: 'from-purple-400 to-purple-600'
    },
    {
      icon: <FiTrendingUp size={32} />,
      title: 'Khuyến mãi thường',
      description: 'Nhận các thương hiệu độc quyền hàng tháng',
      color: 'from-pink-400 to-pink-600'
    }
  ]

  return (
    <div className="w-full relative z-10 bg-blue-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 mb-4">
            Tại sao chọn BusGo?
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            Trải nghiệm đặt vé xe bus tốt nhất với BusGo. An toàn, tiện lợi và tiết kiệm.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-8 border border-slate-100 hover:border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-blue-200 hover:-translate-y-2 transition-all duration-300 group cursor-default relative overflow-hidden"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-white bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
                <p className="text-slate-600 font-medium leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

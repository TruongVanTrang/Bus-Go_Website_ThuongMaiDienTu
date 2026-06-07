import { FiStar } from 'react-icons/fi'

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      location: 'Hà Nội',
      route: 'Cầu Rồng ➔ Huế',
      rating: 5,
      text: 'Dịch vụ tuyệt vời! Quy trình đặt vé cực kỳ nhanh chóng và tiện lợi, vé được gửi về email ngay lập tức. Sẽ tiếp tục ủng hộ BusGo.',
      avatarBg: 'bg-blue-50',
      avatarText: 'text-blue-600'
    },
    {
      name: 'Trần Thị B',
      location: 'Đà Nẵng',
      route: 'Đà Nẵng ➔ Quảng Nam',
      rating: 5,
      text: 'Mình rất hài lòng với chất lượng xe và thái độ của tài xế. Xe chạy êm, sạch sẽ, có đầy đủ wifi và cổng sạc điện thoại tiện lợi.',
      avatarBg: 'bg-blue-100',
      avatarText: 'text-blue-750'
    },
    {
      name: 'Lê Minh C',
      location: 'TP. Hồ Chí Minh',
      route: 'Cầu Rồng ➔ Phố cổ Hội An',
      rating: 5,
      text: 'BusGo giúp mình tiết kiệm rất nhiều thời gian đặt vé khi đi du lịch miền Trung. Giao diện trực quan, dễ thao tác ngay cả cho người lớn tuổi.',
      avatarBg: 'bg-blue-50',
      avatarText: 'text-[#0c3d66]'
    },
    {
      name: 'Phạm Đình D',
      location: 'Hải Phòng',
      route: 'Đà Nẵng ➔ Quảng Ngãi',
      rating: 5,
      text: 'Dịch vụ hỗ trợ trực tuyến hoạt động rất nhiệt tình. Mình gặp sự cố đổi giờ đi lúc nửa đêm nhưng vẫn được nhân viên hỗ trợ giải quyết nhanh gọn.',
      avatarBg: 'bg-blue-100',
      avatarText: 'text-[#004e92]'
    }
  ]

  return (
    <div className="w-full bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-2 font-sans">Đánh giá thực tế</span>
          <h2 className="text-3xl font-black text-[#0c3d66] mb-3">
            Khách hàng nói gì về chúng tôi?
          </h2>
          <p className="text-slate-400 font-semibold text-sm max-w-lg mx-auto">
            Hơn 100,000 khách hàng tin tưởng và đồng hành cùng BusGo mỗi tháng trên mọi nẻo đường.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white rounded-3xl p-8 border border-slate-200/60 shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Giant background quote icon */}
              <div className="absolute right-6 top-1 text-slate-100 text-[120px] font-serif select-none pointer-events-none z-0">
                “
              </div>

              <div className="relative z-10">
                {/* Rating stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar
                      key={i}
                      size={16}
                      className="fill-amber-400 text-amber-400 filter drop-shadow-[0_0_2px_rgba(245,158,11,0.4)]"
                    />
                  ))}
                </div>

                {/* Route detail badge */}
                <div className="inline-flex items-center gap-1 bg-blue-50/70 border border-blue-100/60 rounded-full px-3 py-1 text-[10px] font-bold text-blue-600 mb-5">
                  <span className="text-xs">📍</span>
                  <span>{testimonial.route}</span>
                </div>

                {/* Review Text */}
                <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8 italic">
                  "{testimonial.text}"
                </p>
              </div>

              {/* User profile details */}
              <div className="flex items-center gap-4 pt-4 border-t border-slate-100 relative z-10">
                <div
                  className={`w-12 h-12 rounded-2xl ${testimonial.avatarBg} ${testimonial.avatarText} flex items-center justify-center font-extrabold text-lg border border-blue-100/50 shadow-sm shrink-0`}
                >
                  {testimonial.name.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="font-extrabold text-sm text-slate-800">{testimonial.name}</div>
                  <div className="text-[11px] font-bold text-slate-400">{testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

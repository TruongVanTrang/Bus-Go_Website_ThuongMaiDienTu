import { Card, CardBody } from '@nextui-org/react'
import { FiStar, FiMapPin } from 'react-icons/fi'

const testimonials = [
  {
    name: 'Nguyễn Văn An', location: 'Hà Nội', avatar: 'A', initials: 'bg-blue-600',
    rating: 5,
    text: 'Dịch vụ tuyệt vời! Quy trình đặt vé rất dễ dàng, vé đến đúng giờ. Giá cả cạnh tranh hơn so với các nơi khác.',
    route: 'Đà Nẵng → Huế',
  },
  {
    name: 'Trần Thị Bình', location: 'Đà Nẵng', avatar: 'B', initials: 'bg-blue-500',
    rating: 5,
    text: 'Tôi rất hài lòng! Nhân viên rất thân thiện và chuyên nghiệp. Xe đúng giờ, thoải mái.',
    route: 'Đà Nẵng → Quảng Nam',
  },
  {
    name: 'Lê Minh Cường', location: 'TP. Hồ Chí Minh', avatar: 'C', initials: 'bg-blue-700',
    rating: 5,
    text: 'BusGo giúp tôi tiết kiệm rất nhiều thời gian tìm vé. Giao diện app cực kỳ dễ sử dụng và mượt mà!',
    route: 'Cầu Rồng → Phố cổ Hội An',
  },
  {
    name: 'Phạm Đình Dũng', location: 'Hải Phòng', avatar: 'D', initials: 'bg-blue-800',
    rating: 5,
    text: 'Dịch vụ hỗ trợ khách hàng buổi đêm rất tốt. Được giải đáp thắc mắc ngay lập tức. Giới thiệu cho bạn bè!',
    route: 'Đà Nẵng → Quảng Ngãi',
  },
]

export default function Testimonials() {
  return (
    <div>
      {/* Section Header */}
      <div className="text-center mb-12">
        <p className="text-blue-600 text-sm font-bold uppercase tracking-widest mb-3">Khách hàng nói gì?</p>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
          Hơn <span className="text-blue-600">100,000</span> khách hàng tin tưởng
        </h2>
        <p className="text-slate-400 mt-3 text-base max-w-xl mx-auto">
          Đánh giá thực từ những khách hàng đã trải nghiệm dịch vụ BusGo
        </p>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white border border-slate-100 rounded-2xl p-6
                       hover:shadow-lg hover:shadow-blue-50 hover:-translate-y-0.5
                       transition-all duration-300"
          >
            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
              {[...Array(testimonial.rating)].map((_, i) => (
                <FiStar key={i} size={15} style={{ fill: '#2563eb', color: '#2563eb', strokeWidth: 0 }} />
              ))}
            </div>

            {/* Quote */}
            <p className="text-slate-700 text-sm leading-relaxed mb-5">
              "{testimonial.text}"
            </p>

            {/* Route tag */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1
                             bg-blue-50 border border-blue-100 rounded-full
                             text-blue-600 text-xs font-semibold mb-5">
              <FiMapPin size={10} />
              {testimonial.route}
            </span>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <div className={`w-9 h-9 rounded-full ${testimonial.initials}
                              flex items-center justify-center text-white font-bold text-sm`}>
                {testimonial.avatar}
              </div>
              <div>
                <div className="text-slate-900 font-bold text-sm">{testimonial.name}</div>
                <div className="text-slate-400 text-xs">{testimonial.location}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

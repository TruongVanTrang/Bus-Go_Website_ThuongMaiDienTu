import { FiStar } from 'react-icons/fi'

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      location: 'Hà Nội',
      rating: 5,
      text: 'Dịch vụ tuyệt vời! Quy trình đặt vé dễ dàng, vé đến đúng giờ. Giá cả cạnh tranh.',
      avatarBg: 'bg-blue-100',
      avatarText: 'text-blue-600'
    },
    {
      name: 'Trần Thị B',
      location: 'Đà Nẵng',
      rating: 5,
      text: 'Tôi rất hài lòng với chất lượng dịch vụ. Các nhân viên rất thân thiện và chuyên nghiệp.',
      avatarBg: 'bg-indigo-100',
      avatarText: 'text-indigo-600'
    },
    {
      name: 'Lê Minh C',
      location: 'Sài Gòn',
      rating: 5,
      text: 'BusGo giúp tôi tiết kiệm thời gian tìm vé. Giao diện app rất dễ sử dụng.',
      avatarBg: 'bg-emerald-100',
      avatarText: 'text-emerald-600'
    },
    {
      name: 'Phạm Đình D',
      location: 'Hải Phòng',
      rating: 5,
      text: 'Dịch vụ hỗ trợ khách hàng buổi ban đêm rất tốt. Tôi giới thiệu BusGo cho bạn bè.',
      avatarBg: 'bg-amber-100',
      avatarText: 'text-amber-600'
    }
  ]

  return (
    <div className="w-full relative z-10 bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 mb-4">
            Khách hàng nói gì về chúng tôi?
          </h2>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            Hơn 100,000 khách hàng tin tưởng BusGo mỗi tháng
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={20}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* Text */}
              <p className="text-slate-700 font-medium leading-relaxed mb-8 italic">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-full ${testimonial.avatarBg} ${testimonial.avatarText} flex items-center justify-center font-bold text-xl`}
                >
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm font-medium text-slate-500">{testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

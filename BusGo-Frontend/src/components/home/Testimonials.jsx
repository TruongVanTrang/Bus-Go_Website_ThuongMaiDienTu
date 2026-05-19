import { FiStar } from 'react-icons/fi'
import './Testimonials.css'

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Nguyễn Văn A',
      location: 'Hà Nội',
      rating: 5,
      text: 'Dịch vụ tuyệt vời! Quy trình đặt vé dễ dàng, vé đến đúng giờ. Giá cả cạnh tranh.'
    },
    {
      name: 'Trần Thị B',
      location: 'Đà Nẵng',
      rating: 5,
      text: 'Tôi rất hài lòng với chất lượng dịch vụ. Các nhân viên rất thân thiện và chuyên nghiệp.'
    },
    {
      name: 'Lê Minh C',
      location: 'Sài Gòn',
      rating: 5,
      text: 'BusGo giúp tôi tiết kiệm thời gian tìm vé. Giao diện app rất dễ sử dụng.'
    },
    {
      name: 'Phạm Đình D',
      location: 'Hải Phòng',
      rating: 5,
      text: 'Dịch vụ hỗ trợ khách hàng buổi ban đêm rất tốt. Tôi giới thiệu BusGo cho bạn bè.'
    }
  ]

  return (
    <div className="container-fluid px-md-5 px-3">
      <div className="text-center mb-5">
        <h2 className="text-neutral-900 fw-bold mb-3">
          Khách hàng nói gì về chúng tôi?
        </h2>
        <p className="text-muted fs-5">
          Hơn 100,000 khách hàng tin tưởng BusGo mỗi tháng
        </p>
      </div>

      <div className="row g-4">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="col-lg-6">
            <div className="testimonial-card">
              {/* Stars */}
              <div className="mb-3 d-flex gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <FiStar
                    key={i}
                    size={18}
                    style={{
                      fill: 'var(--color-secondary-500)',
                      color: 'var(--color-secondary-500)',
                      strokeWidth: 0
                    }}
                  />
                ))}
              </div>

              {/* Text */}
              <p className="testimonial-text mb-4">"{testimonial.text}"</p>

              {/* Author */}
              <div className="d-flex align-items-center">
                <div
                  className="avatar me-3"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: 'var(--color-primary-600)',
                    fontSize: '1.25rem'
                  }}
                >
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="fw-bold text-neutral-900">{testimonial.name}</div>
                  <div className="small text-muted">{testimonial.location}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

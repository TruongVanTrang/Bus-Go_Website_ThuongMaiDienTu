import { FiTruck, FiCreditCard, FiShield, FiClock, FiHeadphones, FiTrendingUp } from 'react-icons/fi'
import './Features.css'

export default function Features() {
  const features = [
    {
      icon: <FiTruck size={32} />,
      title: 'Hàng ngàn chuyến',
      description: 'Lựa chọn từ hơn 10,000 chuyến xe mỗi ngày'
    },
    {
      icon: <FiCreditCard size={32} />,
      title: 'Giá tốt nhất',
      description: 'Giá cạnh tranh với nhiều hình thức thanh toán'
    },
    {
      icon: <FiShield size={32} />,
      title: 'An toàn & Tin cậy',
      description: 'Các xe được kiểm tra chất lượng định kỳ'
    },
    {
      icon: <FiClock size={32} />,
      title: 'Đặt vé nhanh',
      description: 'Quy trình đặt vé chỉ mất 3 phút'
    },
    {
      icon: <FiHeadphones size={32} />,
      title: 'Hỗ trợ 24/7',
      description: 'Đội hỗ trợ khách hàng luôn sẵn sàng giúp'
    },
    {
      icon: <FiTrendingUp size={32} />,
      title: 'Khuyến mãi thường',
      description: 'Nhận các thương hiệu độc quyền hàng tháng'
    }
  ]

  return (
    <div className="container-fluid px-md-5 px-3">
      <div className="text-center mb-5">
        <h2 className="text-neutral-900 fw-bold mb-3">
          Tại sao chọn BusGo?
        </h2>
        <p className="text-muted fs-5">
          Trải nghiệm đặt vé xe bus tốt nhất với BusGo
        </p>
      </div>

      <div className="row g-4">
        {features.map((feature, index) => (
          <div key={index} className="col-lg-4 col-md-6">
            <div className="feature-card">
              <div className="feature-icon">
                {feature.icon}
              </div>
              <h4 className="feature-title mt-3">{feature.title}</h4>
              <p className="feature-description text-muted">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

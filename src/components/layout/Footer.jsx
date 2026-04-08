import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer style={{
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      marginTop: '3rem',
      paddingTop: '3rem',
      paddingBottom: '1rem',
      borderTop: '1px solid #333333'
    }}>
      <div className="container-fluid px-md-5 px-3">
        <div className="row mb-5">
          {/* About */}
          <div className="col-lg-3 col-md-6 mb-4">
            <h5 className="fw-bold mb-3" style={{ color: '#ffffff' }}>
              <span style={{ color: '#0066cc' }}>Bus</span>
              <span style={{ color: '#ffffff' }}>Go</span>
            </h5>
            <p style={{ color: '#b3b3b3', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Nền tảng tìm kiếm và đặt vé xe bus, xe khách hiện đại tại miền Trung. Cung cấp giải pháp đặt vé an toàn, nhanh chóng và tiện lợi.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-lg-3 col-md-6 mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#ffffff' }}>Liên Kết Nhanh</h6>
            <ul className="list-unstyled">
              <li>
                <a href="#home" style={{ color: '#b3b3b3', textDecoration: 'none', transition: 'color 0.3s' }} 
                   onMouseEnter={(e) => e.target.style.color = '#0066cc'}
                   onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}>
                  Trang Chủ
                </a>
              </li>
              <li className="mt-2">
                <a href="#search" style={{ color: '#b3b3b3', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.target.style.color = '#0066cc'}
                   onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}>
                  Tìm Vé
                </a>
              </li>
              <li className="mt-2">
                <a href="#about" style={{ color: '#b3b3b3', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.target.style.color = '#0066cc'}
                   onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}>
                  Về Chúng Tôi
                </a>
              </li>
              <li className="mt-2">
                <a href="#contact" style={{ color: '#b3b3b3', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.target.style.color = '#0066cc'}
                   onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}>
                  Liên Hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-lg-3 col-md-6 mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#ffffff' }}>Hỗ Trợ</h6>
            <ul className="list-unstyled">
              <li>
                <a href="#faq" style={{ color: '#b3b3b3', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.target.style.color = '#0066cc'}
                   onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}>
                  Câu Hỏi Thường Gặp
                </a>
              </li>
              <li className="mt-2">
                <a href="#terms" style={{ color: '#b3b3b3', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.target.style.color = '#0066cc'}
                   onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}>
                  Điều Khoản và Điều Kiện
                </a>
              </li>
              <li className="mt-2">
                <a href="#privacy" style={{ color: '#b3b3b3', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.target.style.color = '#0066cc'}
                   onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}>
                  Chính Sách Bảo Mật
                </a>
              </li>
              <li className="mt-2">
                <a href="#support" style={{ color: '#b3b3b3', textDecoration: 'none', transition: 'color 0.3s' }}
                   onMouseEnter={(e) => e.target.style.color = '#0066cc'}
                   onMouseLeave={(e) => e.target.style.color = '#b3b3b3'}>
                  Hỗ Trợ Khách Hàng
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6 mb-4">
            <h6 className="fw-bold mb-3" style={{ color: '#ffffff' }}>Liên Hệ</h6>
            <p style={{ color: '#b3b3b3', fontSize: '0.95rem', lineHeight: '1.8', marginBottom: '1rem' }}>
              📧 <strong>Email:</strong> support@busgo.vn
              <br />
              📱 <strong>Hotline:</strong> 1900 123 456
              <br />
              📍 <strong>Địa chỉ:</strong> Hà Nội, Việt Nam
            </p>

            {/* Social Icons */}
            <div className="d-flex gap-3 mt-3">
              <a href="#fb" style={{ color: '#0066cc', fontSize: '1.25rem', transition: 'all 0.3s' }}
                 onMouseEnter={(e) => { e.target.style.color = '#ffffff'; e.target.style.transform = 'scale(1.2)'; }}
                 onMouseLeave={(e) => { e.target.style.color = '#0066cc'; e.target.style.transform = 'scale(1)'; }}>
                <FiFacebook />
              </a>
              <a href="#ig" style={{ color: '#0066cc', fontSize: '1.25rem', transition: 'all 0.3s' }}
                 onMouseEnter={(e) => { e.target.style.color = '#ffffff'; e.target.style.transform = 'scale(1.2)'; }}
                 onMouseLeave={(e) => { e.target.style.color = '#0066cc'; e.target.style.transform = 'scale(1)'; }}>
                <FiInstagram />
              </a>
              <a href="#tw" style={{ color: '#0066cc', fontSize: '1.25rem', transition: 'all 0.3s' }}
                 onMouseEnter={(e) => { e.target.style.color = '#ffffff'; e.target.style.transform = 'scale(1.2)'; }}
                 onMouseLeave={(e) => { e.target.style.color = '#0066cc'; e.target.style.transform = 'scale(1)'; }}>
                <FiTwitter />
              </a>
              <a href="#ln" style={{ color: '#0066cc', fontSize: '1.25rem', transition: 'all 0.3s' }}
                 onMouseEnter={(e) => { e.target.style.color = '#ffffff'; e.target.style.transform = 'scale(1.2)'; }}
                 onMouseLeave={(e) => { e.target.style.color = '#0066cc'; e.target.style.transform = 'scale(1)'; }}>
                <FiLinkedin />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ borderColor: '#333333', margin: '2rem 0' }} />

        {/* Bottom Footer */}
        <div className="row align-items-center pb-3">
          <div className="col-md-6">
            <p style={{ color: '#999999', marginBottom: 0, fontSize: '0.9rem' }}>
              © 2024 BusGo. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p style={{ color: '#999999', marginBottom: 0, fontSize: '0.9rem' }}>
              Powered by <span style={{ color: '#0066cc', fontWeight: 600 }}>BusGo Technology</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

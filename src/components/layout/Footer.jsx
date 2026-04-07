import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi'

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-white mt-5 pt-5 pb-3">
      <div className="container-fluid px-md-5 px-3">
        <div className="row mb-5">
          {/* About */}
          <div className="col-lg-3 col-md-6 mb-4">
            <h5 className="fw-bold mb-3">
              <span style={{ color: 'var(--color-secondary-500)' }}>Bus</span>
              <span style={{ color: '#fff' }}>Go</span>
            </h5>
            <p className="text-muted">
              Nền tảng tìm kiếm và đặt vé xe bus, xe khách hiện đại tại miền Trung.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-lg-3 col-md-6 mb-4">
            <h6 className="fw-bold mb-3">Liên Kết Nhanh</h6>
            <ul className="list-unstyled">
              <li>
                <a href="#home" className="text-muted text-decoration-none hover-primary">
                  Trang Chủ
                </a>
              </li>
              <li className="mt-2">
                <a href="#search" className="text-muted text-decoration-none hover-primary">
                  Tìm Vé
                </a>
              </li>
              <li className="mt-2">
                <a href="#about" className="text-muted text-decoration-none hover-primary">
                  Về Chúng Tôi
                </a>
              </li>
              <li className="mt-2">
                <a href="#contact" className="text-muted text-decoration-none hover-primary">
                  Liên Hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-lg-3 col-md-6 mb-4">
            <h6 className="fw-bold mb-3">Hỗ Trợ</h6>
            <ul className="list-unstyled">
              <li>
                <a href="#faq" className="text-muted text-decoration-none hover-primary">
                  Câu Hỏi Thường Gặp
                </a>
              </li>
              <li className="mt-2">
                <a href="#terms" className="text-muted text-decoration-none hover-primary">
                  Điều Khoản và Điều Kiện
                </a>
              </li>
              <li className="mt-2">
                <a href="#privacy" className="text-muted text-decoration-none hover-primary">
                  Chính Sách Bảo Mật
                </a>
              </li>
              <li className="mt-2">
                <a href="#support" className="text-muted text-decoration-none hover-primary">
                  Hỗ Trợ Khách Hàng
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="col-lg-3 col-md-6 mb-4">
            <h6 className="fw-bold mb-3">Liên Hệ</h6>
            <p className="text-muted">
              📧 Email: support@busgo.vn
              <br />
              📱 Hotline: 1900 123 456
              <br />
              📍 Địa chỉ: Hà Nội, Việt Nam
            </p>

            {/* Social Icons */}
            <div className="d-flex gap-3 mt-3">
              <a href="#fb" className="text-muted fs-5 hover-primary">
                <FiFacebook />
              </a>
              <a href="#ig" className="text-muted fs-5 hover-primary">
                <FiInstagram />
              </a>
              <a href="#tw" className="text-muted fs-5 hover-primary">
                <FiTwitter />
              </a>
              <a href="#ln" className="text-muted fs-5 hover-primary">
                <FiLinkedin />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="bg-neutral-700" />

        {/* Bottom Footer */}
        <div className="row align-items-center">
          <div className="col-md-6">
            <p className="text-muted mb-0">
              © 2024 BusGo. All rights reserved.
            </p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="text-muted mb-0">
              Powered by BusGo Technology
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

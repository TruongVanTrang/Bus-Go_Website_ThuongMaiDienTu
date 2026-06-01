import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin, FiMail, FiPhone, FiMapPin, FiArrowRight } from 'react-icons/fi'

export default function Footer() {
  const quickLinks = [
    { name: 'Trang Chủ', href: '#home' },
    { name: 'Tìm Vé', href: '#search' },
    { name: 'Về Chúng Tôi', href: '#about' },
    { name: 'Liên Hệ', href: '#contact' },
  ]

  const supportLinks = [
    { name: 'Câu Hỏi Thường Gặp', href: '#faq' },
    { name: 'Điều Khoản và Điều Kiện', href: '#terms' },
    { name: 'Chính Sách Bảo Mật', href: '#privacy' },
    { name: 'Hỗ Trợ Khách Hàng', href: '#support' },
  ]

  const socialLinks = [
    { icon: <FiFacebook size={20} />, href: '#fb', label: 'Facebook' },
    { icon: <FiInstagram size={20} />, href: '#ig', label: 'Instagram' },
    { icon: <FiTwitter size={20} />, href: '#tw', label: 'Twitter' },
    { icon: <FiLinkedin size={20} />, href: '#ln', label: 'LinkedIn' },
  ]

  return (
    <footer className="relative bg-gradient-to-b from-slate-900 to-black text-slate-300 pt-20 pb-8 mt-16 overflow-hidden border-t border-slate-800">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-30"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand & About */}
          <div className="space-y-6">
            <h5 className="text-3xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Bus</span>
              <span className="text-white">Go</span>
            </h5>
            <p className="text-slate-400 text-sm leading-relaxed">
              Nền tảng tìm kiếm và đặt vé xe bus, xe khách hiện đại tại miền Trung. Trải nghiệm giải pháp đặt vé an toàn, nhanh chóng và tiện lợi với tiêu chuẩn dịch vụ 5 sao.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-blue-400 hover:bg-blue-500 hover:text-white hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300 ease-out transform hover:-translate-y-1"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h6 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
              Liên Kết Nhanh
            </h6>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="group flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors duration-300"
                  >
                    <FiArrowRight className="text-blue-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300 block">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h6 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-cyan-500 rounded-full"></span>
              Hỗ Trợ
            </h6>
            <ul className="space-y-3">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="group flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors duration-300"
                  >
                    <FiArrowRight className="text-cyan-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    <span className="group-hover:translate-x-1 transition-transform duration-300 block">
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h6 className="text-white text-lg font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-blue-500 rounded-full"></span>
              Liên Hệ
            </h6>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-400 hover:text-white transition-colors duration-300">
                <div className="mt-1 p-2 bg-slate-800 rounded-lg text-blue-400">
                  <FiMail size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Email</div>
                  <a href="mailto:support@busgo.vn" className="hover:text-blue-400 transition-colors">support@busgo.vn</a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-400 hover:text-white transition-colors duration-300">
                <div className="mt-1 p-2 bg-slate-800 rounded-lg text-blue-400">
                  <FiPhone size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Hotline</div>
                  <a href="tel:1900123456" className="hover:text-blue-400 transition-colors">1900 123 456</a>
                </div>
              </li>
              <li className="flex items-start gap-3 text-slate-400 hover:text-white transition-colors duration-300">
                <div className="mt-1 p-2 bg-slate-800 rounded-lg text-blue-400">
                  <FiMapPin size={16} />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Địa chỉ</div>
                  <span>Hà Nội, Việt Nam</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} <span className="text-white font-semibold">BusGo</span>. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="hover:text-blue-400 cursor-pointer transition-colors">Điều khoản</span>
            <span>•</span>
            <span className="hover:text-blue-400 cursor-pointer transition-colors">Bảo mật</span>
            <span>•</span>
            <p>
              Powered by <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent font-bold">BusGo Technology</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

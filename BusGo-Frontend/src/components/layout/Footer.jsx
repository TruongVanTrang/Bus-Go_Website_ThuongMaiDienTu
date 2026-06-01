import { Link } from 'react-router-dom'
import { FiFacebook, FiInstagram, FiTwitter, FiLinkedin, FiMail, FiPhone, FiMapPin, FiHeart } from 'react-icons/fi'
import { Divider } from '@nextui-org/react'

const quickLinks = [
  { label: 'Trang Chủ', href: '/' },
  { label: 'Tìm Vé', href: '/search' },
  { label: 'Gửi Hàng', href: '/cargo-consignment' },
  { label: 'Lịch Sử Đặt Vé', href: '/history' },
]

const supportLinks = [
  { label: 'Câu Hỏi Thường Gặp', href: '#faq' },
  { label: 'Điều Khoản & Điều Kiện', href: '#terms' },
  { label: 'Chính Sách Bảo Mật', href: '#privacy' },
  { label: 'Hỗ Trợ Khách Hàng', href: '#support' },
]

const socials = [
  { icon: <FiFacebook size={18} />, href: '#fb', label: 'Facebook' },
  { icon: <FiInstagram size={18} />, href: '#ig', label: 'Instagram' },
  { icon: <FiTwitter size={18} />, href: '#tw', label: 'Twitter' },
  { icon: <FiLinkedin size={18} />, href: '#ln', label: 'LinkedIn' },
]

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-1 text-3xl font-black tracking-tight mb-4">
              <span className="text-sky-400">Bus</span>
              <span className="text-amber-400">Go</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Nền tảng tìm kiếm và đặt vé xe bus, xe khách hiện đại tại miền Trung.
              An toàn · Nhanh chóng · Tiện lợi.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-500/40 text-slate-400 hover:text-sky-400 transition-all duration-200"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-5">
              Liên Kết Nhanh
            </h6>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-slate-400 hover:text-sky-400 text-sm font-medium transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-sky-500 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-5">
              Hỗ Trợ
            </h6>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-sky-400 text-sm font-medium transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-sky-500 transition-colors" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h6 className="text-white font-bold text-sm uppercase tracking-widest mb-5">
              Liên Hệ
            </h6>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0 mt-0.5">
                  <FiMail size={14} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Email</div>
                  <div className="text-slate-300 text-sm font-medium">support@busgo.vn</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                  <FiPhone size={14} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Hotline</div>
                  <div className="text-slate-300 text-sm font-medium">1900 123 456</div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                  <FiMapPin size={14} />
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Địa chỉ</div>
                  <div className="text-slate-300 text-sm font-medium">Đà Nẵng, Việt Nam</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <Divider className="bg-white/[0.06] mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-sm">
            © 2025 BusGo. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm flex items-center gap-1.5">
            Made with <FiHeart size={13} className="text-red-400 fill-red-400" /> by{' '}
            <span className="text-sky-400 font-semibold">BusGo Technology</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

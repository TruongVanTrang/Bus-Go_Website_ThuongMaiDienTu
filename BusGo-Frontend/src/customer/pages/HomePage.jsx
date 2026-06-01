import SearchBar from '../../components/home/SearchBar'
import HomeSuggestions from '../../components/home/HomeSuggestions'
import UpcomingTrips from '../../components/home/UpcomingTrips'
import Features from '../../components/home/Features'
import Testimonials from '../../components/home/Testimonials'
import { motion } from 'framer-motion'

const fadeUp = (delay = 0) => ({
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.7, ease: 'easeOut', delay },
})

const STATS = [
  { value: '100K+', label: 'Khách hàng tin dùng' },
  { value: '500+', label: 'Tuyến đường' },
  { value: '4.9', label: 'Đánh giá trung bình' },
  { value: '24/7', label: 'Hỗ trợ khách hàng' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-[92vh] flex flex-col justify-center items-center overflow-hidden">

        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/banner.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/20" />
        </div>

        {/* Decorative Blobs */}
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                        flex flex-col lg:flex-row items-center gap-12 lg:gap-16 pt-24 pb-8">

          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div {...fadeUp(0.1)}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5
                               bg-blue-500/20 border border-blue-400/30 rounded-full
                               text-blue-200 text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Nền tảng đặt vé #1 miền Trung
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.2)}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6"
            >
              Đặt vé xe<br />
              <span className="text-blue-400">thông minh</span>{' '}
              <span className="text-white/90">cực nhanh</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.3)}
              className="text-lg text-white/55 max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed"
            >
              Tìm kiếm và đặt vé xe bus, xe khách liên tỉnh chỉ trong vài giây.
              An toàn · Tiện lợi · Giá tốt nhất.
            </motion.p>

            {/* Route Pills */}
            <motion.div {...fadeUp(0.4)} className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {['Nội thành Đà Nẵng', 'Đà Nẵng → Huế', 'Đà Nẵng → Quảng Nam'].map((tag) => (
                <span key={tag}
                  className="px-3 py-1.5 bg-white/10 hover:bg-blue-500/25
                             border border-white/15 hover:border-blue-400/40
                             rounded-full text-white/75 hover:text-white
                             text-sm font-medium cursor-pointer transition-all duration-200">
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: Search Card */}
          <motion.div {...fadeUp(0.3)} className="w-full lg:w-auto lg:flex-shrink-0">
            <SearchBar />
          </motion.div>
        </div>

        {/* ===== STATS BAR – Không nền, chỉ text ===== */}
        <motion.div
          {...fadeUp(0.55)}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
        >
          <div className="flex items-center justify-center lg:justify-start gap-8 sm:gap-14 flex-wrap">
            {STATS.map((stat, idx) => (
              <div key={stat.value} className="flex items-center gap-3">
                {idx > 0 && (
                  <div className="hidden sm:block w-px h-8 bg-white/15" />
                )}
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[11px] text-white/70 font-medium mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">

          <motion.section
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          >
            <HomeSuggestions />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          >
            <UpcomingTrips />
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          >
            <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-8 md:p-14 shadow-2xl shadow-blue-900/30">
              <Features />
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6 }}
          >
            <Testimonials />
          </motion.section>

        </div>
      </div>
    </div>
  )
}

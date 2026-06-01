import SearchBar from '../../components/home/SearchBar'
import HomeSuggestions from '../../components/home/HomeSuggestions'
import UpcomingTrips from '../../components/home/UpcomingTrips'
import MultiSearchMethods from '../../components/home/MultiSearchMethods'
import FeaturedTrips from '../../components/home/FeaturedTrips'
import Features from '../../components/home/Features'
import Testimonials from '../../components/home/Testimonials'
import { useEffect } from 'react'

export default function HomePage() {
  useEffect(() => {
    // Xóa bản nháp đặt vé khi về trang chủ
    sessionStorage.removeItem('bookingDraft')
  }, [])

  return (
    <div className="homepage min-h-screen bg-slate-50">
      {/* Hero Section with Search Bar */}
      <section className="hero bg-white">
        <SearchBar />
      </section>

      {/* Home Suggestions Section - Recent Activity & Tuyến đường phổ biến */}
      <section className="py-2">
        <HomeSuggestions />
      </section>

      {/* Dịch vụ chất lượng cao (Was originally inside HomeSuggestions) */}
      <section className="py-2">
        <FeaturedTrips />
      </section>

      {/* Upcoming Trips Section */}
      <section className="py-2">
        <UpcomingTrips />
      </section>

      {/* Multi-Search Methods Section */}
      <section className="py-2">
        <MultiSearchMethods />
      </section>

      {/* Features Section */}
      <section className="py-4">
        <Features />
      </section>

      {/* Testimonials Section */}
      <section className="py-4">
        <Testimonials />
      </section>
    </div>
  )
}

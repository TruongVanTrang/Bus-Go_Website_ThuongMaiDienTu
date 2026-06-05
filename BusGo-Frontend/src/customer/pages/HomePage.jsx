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
      {/* 1. Hero Section with Video Background and Search Bar */}
      <section className="hero bg-white">
        <SearchBar />
      </section>

      {/* 2. Recent activity & Popular Routes */}
      <section className="py-2">
        <HomeSuggestions />
      </section>

      {/* 3. Core Features - Why Choose Us */}
      <section className="py-2">
        <Features />
      </section>

      {/* 4. Connected Train Upcoming Trips */}
      <section className="py-2">
        <UpcomingTrips />
      </section>

      {/* 5. Featured High Quality Trips */}
      <section className="py-2">
        <FeaturedTrips />
      </section>

      {/* 6. Multi-Search exploration tabs */}
      <section className="py-2">
        <MultiSearchMethods />
      </section>

      {/* 7. Customer Testimonials */}
      <section className="py-4">
        <Testimonials />
      </section>
    </div>
  )
}

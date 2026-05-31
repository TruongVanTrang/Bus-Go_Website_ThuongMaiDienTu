import SearchBar from '../../components/home/SearchBar'
import HomeSuggestions from '../../components/home/HomeSuggestions'
import UpcomingTrips from '../../components/home/UpcomingTrips'
import MultiSearchMethods from '../../components/home/MultiSearchMethods'
import FeaturedTrips from '../../components/home/FeaturedTrips'
import Features from '../../components/home/Features'
import Testimonials from '../../components/home/Testimonials'

export default function HomePage() {
  return (
    <div className="homepage min-h-screen bg-slate-50">
      {/* Hero Section with Search Bar */}
      <section className="hero bg-white">
        <SearchBar />
      </section>

      {/* Home Suggestions Section - Recent Activity & Tuyến đường phổ biến */}
      <section>
        <HomeSuggestions />
      </section>

      {/* Dịch vụ chất lượng cao (Was originally inside HomeSuggestions) */}
      <section>
        <FeaturedTrips />
      </section>

      {/* Upcoming Trips Section */}
      <section>
        <UpcomingTrips />
      </section>

      {/* Multi-Search Methods Section */}
      <section>
        <MultiSearchMethods />
      </section>

      {/* Features Section */}
      <section>
        <Features />
      </section>

      {/* Testimonials Section */}
      <section>
        <Testimonials />
      </section>
    </div>
  )
}

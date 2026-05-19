import SearchBar from '../components/home/SearchBar'
import HomeSuggestions from '../components/home/HomeSuggestions'
import UpcomingTrips from '../components/home/UpcomingTrips'
import MultiSearchMethods from '../components/home/MultiSearchMethods'
import Features from '../components/home/Features'
import Testimonials from '../components/home/Testimonials'

export default function HomePage() {
  return (
    <div className="homepage">
      {/* Hero Section with Search Bar */}
      <section className="hero">
        <SearchBar />
      </section>

      {/* Home Suggestions Section - Recent Activity & Personalization */}
      <section>
        <HomeSuggestions />
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
      <section className="py-5">
        <Features />
      </section>

      {/* Testimonials Section */}
      <section className="py-5 bg-neutral-50">
        <Testimonials />
      </section>
    </div>
  )
}

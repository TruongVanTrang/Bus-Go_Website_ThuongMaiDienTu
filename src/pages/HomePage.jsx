import SearchBar from '../components/home/SearchBar'
import Features from '../components/home/Features'
import Testimonials from '../components/home/Testimonials'

export default function HomePage() {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <SearchBar />
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

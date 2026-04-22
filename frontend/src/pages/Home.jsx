import { Link } from "react-router-dom";

const heroMetrics = [
  { value: "24/7", label: "Booking Access" },
  { value: "100+", label: "Specialists" },
  { value: "5 min", label: "Average Booking Time" }
];

const careJourney = [
  {
    title: "Choose the Right Specialist",
    description: "Search by specialization and compare profiles, fees, and availability."
  },
  {
    title: "Book in Minutes",
    description: "Pick a date and time slot, then confirm your appointment instantly."
  },
  {
    title: "Manage Follow-Up Care",
    description: "Track prescriptions, reports, and appointment history in one dashboard."
  }
];

const trustStats = [
  { value: "99.9%", label: "Platform Uptime" },
  { value: "4.8/5", label: "Average Patient Rating" },
  { value: "12k+", label: "Appointments Managed" }
];

const testimonials = [
  {
    quote: "I booked a specialist appointment in under five minutes, and everything was clearly organized.",
    author: "Nadeesha M.",
    role: "Patient"
  },
  {
    quote: "The reminders and prescription tracking reduced missed follow-ups for my entire family.",
    author: "Ravindu P.",
    role: "Caregiver"
  }
];

function Home() {
  return (
    <>
      <section className="landing-hero">
        <div className="container">
          <div className="landing-hero__layout">
            <div className="landing-hero__copy">
              <span className="eyebrow">Smart Healthcare Platform</span>
              <h1>Personalized Healthcare, From Search to Follow-Up</h1>
              <p>
                Find trusted doctors, book available slots, and manage reports, prescriptions, and payments
                from one patient-first portal.
              </p>

              <div className="landing-hero__actions">
                <Link className="btn btn-primary btn-large" to="/doctors">
                  Find Doctors
                </Link>
                <Link className="btn btn-outline btn-large" to="/register-patient">
                  Get Started
                </Link>
              </div>

              <div className="landing-hero__metrics">
                {heroMetrics.map((metric) => (
                  <div className="landing-hero__metric" key={metric.label}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-hero__panel">
              <article className="landing-hero__panel-card landing-hero__panel-card--feature">
                <h3>Care Journey</h3>
                <ul className="landing-hero__checklist">
                  <li>Verified doctor profiles and specialization filters</li>
                  <li>Real-time slot-based booking experience</li>
                  <li>Reports and prescription history in one place</li>
                </ul>
              </article>

              <article className="landing-hero__panel-card">
                <h3>Why Patients Prefer Us</h3>
                <div className="landing-hero__mini-stats">
                  <div>
                    <strong>Secure</strong>
                    <span>Secure access and protected routes</span>
                  </div>
                  <div>
                    <strong>Transparent</strong>
                    <span>Doctor fees, slots, and status clearly shown</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft" id="platform-features">
        <div className="container">
          <div className="section-header text-center">
            <span className="eyebrow">Services</span>
            <h2>Everything You Need in One Place</h2>
            <p>Simple, fast, and reliable tools for your full care journey.</p>
          </div>

          <div className="landing-feature-grid">
            <article className="landing-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>Trusted Doctors</h3>
              <p>Browse specialists with clear profile data, credentials, and consultation details.</p>
            </article>

            <article className="landing-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3>Quick Appointments</h3>
              <p>Pick convenient slots instantly with a guided booking flow built for speed.</p>
            </article>

            <article className="landing-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="8" y1="13" x2="16" y2="13"/>
                  <line x1="8" y1="17" x2="12" y2="17"/>
                </svg>
              </div>
              <h3>Medical Reports</h3>
              <p>Keep lab reports and key documents centralized for faster doctor consultations.</p>
            </article>

            <article className="landing-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1v22"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <h3>Secure Payments</h3>
              <p>Pay consultation fees confidently and monitor payment status without confusion.</p>
            </article>

            <article className="landing-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="17 3 21 3 21 7"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </div>
              <h3>Live Availability</h3>
              <p>See only active dated slots published by doctors, reducing back-and-forth calls.</p>
            </article>

            <article className="landing-feature-card">
              <div className="feature-icon-wrapper">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <h3>Continuity of Care</h3>
              <p>Review visit history and prescriptions to make every follow-up more informed.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header text-center">
            <span className="eyebrow">How It Works</span>
            <h2>Three Simple Steps to Better Care</h2>
            <p>From discovery to follow-up, every step is optimized for clarity and speed.</p>
          </div>

          <div className="landing-flow-grid">
            {careJourney.map((step, index) => (
              <article className="landing-flow-step" key={step.title}>
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <div className="landing-proof">
            <div className="landing-proof__stats">
              {trustStats.map((item) => (
                <article className="landing-proof__stat" key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>

            <div className="landing-testimonial-grid">
              {testimonials.map((item) => (
                <article className="landing-testimonial-card" key={item.author}>
                  <p>"{item.quote}"</p>
                  <div>
                    <strong>{item.author}</strong>
                    <span>{item.role}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="landing-cta">
            <div className="landing-cta__content">
              <h2>Need a Consultation?</h2>
              <p>Create your account and start managing appointments, reports, and prescriptions in one place.</p>
              <ul className="landing-cta__points">
                <li>Book verified specialists by date and time</li>
                <li>Track appointments and consultation records</li>
                <li>Access prescriptions and report history anytime</li>
              </ul>
            </div>
            <div className="landing-cta__actions">
              <Link className="btn btn-primary btn-large" to="/register-patient">
                Sign Up
              </Link>
              <Link className="btn btn-outline btn-large" to="/login">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;

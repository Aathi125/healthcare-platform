import { Link } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__top">
        <section className="site-footer__about">
          <h3>medicare</h3>
          <p>
            Telemedicine infrastructure for appointment booking, remote consultations,
            prescriptions, reports, payments, and coordinated follow-up care.
          </p>
                  </section>

        <section className="site-footer__links">
          <h4>Platform</h4>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/doctors">Doctors</Link>
            </li>
          </ul>
        </section>

        <section className="site-footer__links">
          <h4>Account</h4>
          <ul>
            <li>
              <Link to="/login">Sign In</Link>
            </li>
            <li>
              <Link to="/register-patient">Sign Up</Link>
            </li>
            <li>
              <Link to="/doctors">Book Appointment</Link>
            </li>
          </ul>
        </section>

        <section className="site-footer__contact">
          <h4>Operations</h4>
          <ul>
            <li>
              <strong>Email:</strong> care@medicare.local
            </li>
            <li>
              <strong>API Gateway:</strong> localhost:4000
            </li>
            <li>
              <strong>Hours:</strong> 24/7 triage availability
            </li>
          </ul>
        </section>
      </div>

      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p>&copy; {year} medicare. All rights reserved.</p>
          <p className="site-footer__bottom-note">Designed as a production-style telemedicine SaaS for academic deployment.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { doctorService } from "../services/doctorService";

function DoctorDetails({ dashboardMode = false }) {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDoctor = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await doctorService.getDoctorById(id);
        setDoctor(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load doctor profile.");
      } finally {
        setLoading(false);
      }
    };

    loadDoctor();
  }, [id]);

  const availabilityByDay = useMemo(() => {
    if (!doctor || !Array.isArray(doctor.availability)) return [];

    const mapped = doctor.availability.map((entry, index) => {
      const normalizedDate = entry?.date ? entry.date.toString().trim().slice(0, 10) : "";
      const formattedDate = normalizedDate
        ? new Date(`${normalizedDate}T00:00:00`).toLocaleDateString(undefined, {
            weekday: "short",
            year: "numeric",
            month: "short",
            day: "numeric"
          })
        : "";
      const day = (entry?.day || `Day ${index + 1}`).toString().trim();
      const slots = Array.isArray(entry?.slots)
        ? entry.slots.map((slot) => (slot || "").toString().trim()).filter(Boolean)
        : [];

      return {
        day,
        date: normalizedDate,
        dateLabel: formattedDate,
        slots
      };
    });

    return mapped.sort((a, b) => {
      if (a.date && b.date) return a.date.localeCompare(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return a.day.localeCompare(b.day);
    });
  }, [doctor]);

  const totalSlots = useMemo(
    () => availabilityByDay.reduce((count, day) => count + day.slots.length, 0),
    [availabilityByDay]
  );

  if (loading) {
    return (
      <section className="section container">
        <Loader label="Loading profile..." />
      </section>
    );
  }

  if (error || !doctor) {
    return (
      <section className="section container">
        <EmptyState
          title="Doctor not available"
          message={error || "This doctor profile is currently unavailable."}
        />
      </section>
    );
  }

  const content = (
    <>
      {dashboardMode ? (
        <div className="patient-doctor-details-actions">
          <Link className="btn btn-outline btn-small" to="/patient/doctors">
            Back to Doctors
          </Link>
        </div>
      ) : null}

      <div className={dashboardMode ? "patient-doctor-details-content" : "container"}>
        <div className="details-hero">
          <div>
            <span className="eyebrow">Doctor Profile</span>
            <h1>{doctor.name}</h1>
            <p className="doctor-specialization">{doctor.specialization || "General Medicine"}</p>
          </div>
          <span className={doctor.verified ? "badge badge-success" : "badge"}>
            {doctor.verified ? "Verified" : "Pending Verification"}
          </span>
        </div>

        <div className="details-layout">
          <div className="details-card">
            <h2>Profile Overview</h2>
            <div className="details-grid">
              <div className="details-field">
                <strong>Email</strong>
                <span>{doctor.email}</span>
              </div>
              <div className="details-field">
                <strong>Hospital</strong>
                <span>{doctor.hospital || "Not specified"}</span>
              </div>
              <div className="details-field">
                <strong>Experience</strong>
                <span>{doctor.experience || 0} years</span>
              </div>
              <div className="details-field">
                <strong>Consultation Fee</strong>
                <span>LKR {doctor.consultationFee || 0}</span>
              </div>
            </div>
          </div>

          <div className="details-card">
            <div className="availability-card-head">
              <h2>Available Slots</h2>
              <p>
                {availabilityByDay.length} day{availabilityByDay.length === 1 ? "" : "s"} · {totalSlots} slot
                {totalSlots === 1 ? "" : "s"}
              </p>
            </div>

            {availabilityByDay.length > 0 ? (
              <div className="availability-day-grid">
                {availabilityByDay.map((item, index) => (
                  <article className="availability-day-card" key={`${item.date || item.day}-${index}`}>
                    <header className="availability-day-head">
                      <h3>{item.dateLabel || item.day}</h3>
                      <span>
                        {item.slots.length} slot{item.slots.length === 1 ? "" : "s"}
                      </span>
                    </header>

                    {item.slots.length > 0 ? (
                      <div className="availability-slot-wrap">
                        {item.slots.map((slot, slotIndex) => (
                          <span className="availability-slot-chip" key={`${item.day}-${slot}-${slotIndex}`}>
                            {slot}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="availability-day-empty">No slots listed for this day.</p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="availability-day-empty">No availability listed yet.</p>
            )}
          </div>

          <div className="details-card">
            <h2>Appointments</h2>
            {isAuthenticated && user?.role === "PATIENT" && (
              <Link className="btn btn-primary" to={`/patient/book-appointment?doctorId=${doctor._id}`}>
                Book Appointment
              </Link>
            )}

            {isAuthenticated && user?.role !== "PATIENT" && (
              <p className="details-note">Only patient accounts can book appointments.</p>
            )}

            {!isAuthenticated && (
              <>
                <p className="details-note">Login with a patient account to book an appointment.</p>
                <Link className="btn btn-outline" to="/login">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <section className={dashboardMode ? "dashboard-page patient-doctor-details-page" : "section section-soft"}>
      {content}
    </section>
  );
}

export default DoctorDetails;

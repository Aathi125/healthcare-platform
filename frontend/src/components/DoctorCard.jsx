import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SlotAvailabilityModal from "./SlotAvailabilityModal";

const getInitials = (name = "") => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "DR";
};

const getSpecializationMark = (specialization = "") =>
  specialization
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "MD";

function DoctorCard({ doctor, detailsHref, bookingHref }) {
  const navigate = useNavigate();
  const [showSlotModal, setShowSlotModal] = useState(false);
  const name = doctor.name || "Doctor";
  const specialization = doctor.specialization || "General Medicine";
  const hospital = doctor.hospital || "City Medical Center";
  const experience = doctor.experience || 0;
  const consultationFee = doctor.consultationFee || 0;
  const isVerified = doctor.verified || false;
  const resolvedDetailsHref = detailsHref || `/doctors/${doctor._id}`;
  const resolvedBookingHref = bookingHref || `/patient/book-appointment?doctorId=${doctor._id}`;
  const availabilityEntries = Array.isArray(doctor.availability)
    ? doctor.availability.filter((entry) => Array.isArray(entry?.slots) && entry.slots.length > 0)
    : [];

  const datedEntries = availabilityEntries
    .map((entry) => {
      const dateKey = entry?.date ? entry.date.toString().slice(0, 10) : "";
      return { ...entry, dateKey };
    })
    .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const firstAvailableDay = datedEntries[0] || availabilityEntries[0] || null;
  const previewSlots = firstAvailableDay?.slots?.slice(0, 4) || [];
  const firstAvailableLabel = firstAvailableDay?.date
    ? new Date(`${firstAvailableDay.date.toString().slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric"
      })
    : firstAvailableDay?.day || "";

  const handleBookNowClick = (e) => {
    e.preventDefault();
    setShowSlotModal(true);
  };

  const handleCloseModal = () => {
    setShowSlotModal(false);
  };

  const handleProceedToBooking = ({ doctorId, appointmentDate, timeSlot }) => {
    navigate(`/patient/book-appointment?doctorId=${doctorId}&appointmentDate=${appointmentDate}&timeSlot=${timeSlot}`);
  };

  return (
    <>
      <article className="doctor-card">
      <div className="doctor-card-header">
        <div className="doctor-avatar-container">
          <div className="doctor-avatar">
            {getInitials(name)}
          </div>
          {isVerified && (
            <div className="verification-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          )}
        </div>
        
        <div className="doctor-info">
          <h3 className="doctor-name">{name}</h3>
          <div className="doctor-specialization">
            <span className="specialization-icon">{getSpecializationMark(specialization)}</span>
            <span>{specialization}</span>
          </div>
          {isVerified && (
            <span className="verified-tag">Verified Doctor</span>
          )}
        </div>
      </div>

      <div className="doctor-details">
        <div className="detail-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21v-4a4 4 0 0 1 4-4h5"/>
            <rect x="8" y="3" width="9" height="5" rx="1"/>
            <path d="M8 8v13"/>
          </svg>
          <div>
            <span className="detail-label">Hospital</span>
            <span className="detail-value">{hospital}</span>
          </div>
        </div>

        <div className="detail-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <div>
            <span className="detail-label">Experience</span>
            <span className="detail-value">{experience} years</span>
          </div>
        </div>

        <div className="detail-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <div>
            <span className="detail-label">Consultation</span>
            <span className="detail-value">LKR {consultationFee.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="doctor-availability">
        <div className="availability-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          <span>{firstAvailableDay ? `Next Available: ${firstAvailableLabel}` : "Availability Pending"}</span>
        </div>
        {previewSlots.length > 0 ? (
          <div className="time-slots">
            {previewSlots.map((slot, index) => (
              <span key={index} className="time-slot">{slot}</span>
            ))}
          </div>
        ) : (
          <p className="availability-empty">Slots are not published yet.</p>
        )}
      </div>

      <div className="doctor-actions">
        <Link to={resolvedDetailsHref} className="btn btn-outline">
          View Profile
        </Link>
        <button 
          onClick={handleBookNowClick} 
          className="btn btn-primary"
        >
          Book Now
        </button>
      </div>
    </article>

      <SlotAvailabilityModal
        doctor={doctor}
        isOpen={showSlotModal}
        onClose={handleCloseModal}
        onProceedToBooking={handleProceedToBooking}
      />
    </>
  );
}

export default DoctorCard;

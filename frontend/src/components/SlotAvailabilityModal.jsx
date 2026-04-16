import { useState, useEffect } from "react";
import { appointmentService } from "../services/appointmentService";

const getTodayLocalDate = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const formatAppointmentDate = (value) => {
  if (!value) return "Not selected";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

function SlotAvailabilityModal({ doctor, isOpen, onClose, onProceedToBooking }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const minBookingDate = getTodayLocalDate();

  useEffect(() => {
    if (!isOpen) {
      setSelectedDate("");
      setAvailableSlots([]);
      setSlotError("");
      setSelectedSlot("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedDate && doctor?._id) {
      loadAvailableSlots();
    } else {
      setAvailableSlots([]);
      setSlotError("");
      setSelectedSlot("");
    }
  }, [selectedDate, doctor?._id]);

  const loadAvailableSlots = async () => {
    if (!selectedDate || !doctor?._id) return;

    setLoadingSlots(true);
    setSlotError("");

    try {
      const data = await appointmentService.getAvailableSlots({
        doctorProfileId: doctor._id,
        appointmentDate: selectedDate
      });
      const slots = Array.isArray(data.availableSlots) ? data.availableSlots : [];
      setAvailableSlots(slots);
      setSelectedSlot(slots[0] || "");
    } catch (err) {
      setAvailableSlots([]);
      setSelectedSlot("");
      setSlotError(err.response?.data?.message || "Failed to load available slots.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleProceed = () => {
    if (selectedDate && selectedSlot) {
      onProceedToBooking({
        doctorId: doctor._id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot
      });
      onClose();
    }
  };

  const slotStatusText = () => {
    if (!selectedDate) {
      return "Choose a date to view slots";
    }
    if (loadingSlots) {
      return "Checking slot availability...";
    }
    if (slotError) {
      return "Could not load slots";
    }
    if (availableSlots.length === 0) {
      return "No slots available for this day";
    }
    return `${availableSlots.length} slot${availableSlots.length === 1 ? "" : "s"} available`;
  };

  if (!isOpen || !doctor) return null;

  return (
    <div className="modal-overlay">
      <div className="modal slot-availability-modal">
        <div className="modal-header">
          <h2>Available Slots</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="doctor-info-summary">
            <h3>{doctor.name}</h3>
            <p>{doctor.specialization}</p>
            <p>Consultation Fee: LKR {doctor.consultationFee || 0}</p>
          </div>

          <div className="booking-form-section">
            <label>
              Appointment Date
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={minBookingDate}
                required
              />
            </label>

            <div className="slot-availability-info">
              <p className="field-label">Slot Availability</p>
              <p className="slot-status">{slotStatusText()}</p>
            </div>

            <div className="slot-picker-section">
              <p className="field-label">Time Slot</p>

              {!selectedDate ? (
                <div className="slot-grid-empty">Select a date to load slots.</div>
              ) : loadingSlots ? (
                <div className="slot-grid-empty">Loading available slots...</div>
              ) : availableSlots.length === 0 ? (
                <div className="slot-grid-empty">No available slots for this date. Try another day.</div>
              ) : (
                <div className="slot-grid">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`slot-chip ${selectedSlot === slot ? "slot-chip--active" : ""}`}
                      onClick={() => handleSlotSelect(slot)}
                      aria-pressed={selectedSlot === slot}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {slotError && <p className="form-error">{slotError}</p>}
        </div>

        <div className="modal-footer">
          <div className="booking-summary">
            <p><strong>Selected:</strong> {formatAppointmentDate(selectedDate)} at {selectedSlot || "No time selected"}</p>
          </div>
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleProceed}
              disabled={!selectedDate || !selectedSlot || loadingSlots}
            >
              Proceed to Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlotAvailabilityModal;

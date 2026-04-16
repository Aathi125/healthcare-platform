import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { appointmentService } from "../../services/appointmentService";
import { doctorService } from "../../services/doctorService";

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

function BookAppointment() {
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = searchParams.get("doctorId") || "";
  const preselectedDate = searchParams.get("appointmentDate") || "";
  const preselectedTimeSlot = searchParams.get("timeSlot") || "";
  const minBookingDate = useMemo(() => getTodayLocalDate(), []);

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotError, setSlotError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    doctorProfileId: preselectedDoctorId,
    appointmentDate: preselectedDate,
    timeSlot: preselectedTimeSlot,
    reason: ""
  });

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === form.doctorProfileId) || null,
    [doctors, form.doctorProfileId]
  );

  useEffect(() => {
    const loadDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const data = await doctorService.getDoctors();
        setDoctors(Array.isArray(data) ? data : []);
      } catch {
        setDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  const loadAvailableSlots = useCallback(async (doctorProfileId, appointmentDate) => {
    if (!doctorProfileId || !appointmentDate) {
      setAvailableSlots([]);
      setSlotError("");
      setForm((prev) => ({ ...prev, timeSlot: "" }));
      return;
    }

    setLoadingSlots(true);
    setSlotError("");

    try {
      const data = await appointmentService.getAvailableSlots({ doctorProfileId, appointmentDate });
      const slots = Array.isArray(data.availableSlots) ? data.availableSlots : [];
      setAvailableSlots(slots);
      setForm((prev) => ({
        ...prev,
        timeSlot: slots.includes(prev.timeSlot) ? prev.timeSlot : slots[0] || ""
      }));
    } catch (err) {
      setAvailableSlots([]);
      setForm((prev) => ({ ...prev, timeSlot: "" }));
      setSlotError(err.response?.data?.message || "Failed to load available slots.");
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  useEffect(() => {
    loadAvailableSlots(form.doctorProfileId, form.appointmentDate);
  }, [form.doctorProfileId, form.appointmentDate, loadAvailableSlots]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const selectSlot = (slot) => {
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, timeSlot: slot }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.timeSlot) {
      setError("Select a time slot to continue.");
      return;
    }

    setSaving(true);

    try {
      const data = await appointmentService.bookAppointment(form);
      setSuccess(data.message || "Appointment booked successfully.");
      setForm((prev) => ({ ...prev, reason: "" }));
      await loadAvailableSlots(form.doctorProfileId, form.appointmentDate);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to book appointment.");
    } finally {
      setSaving(false);
    }
  };

  const slotStatusText = useMemo(() => {
    if (!form.doctorProfileId || !form.appointmentDate) {
      return "Choose doctor and date to view slots";
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
  }, [form.doctorProfileId, form.appointmentDate, loadingSlots, slotError, availableSlots.length]);

  return (
    <section className="dashboard-page book-appointment-page">
      <PageHeader
        title="Book Appointment"
        subtitle="Fill in your consultation details and pick an available slot."
      />

      <div className="booking-layout">
        <form className="form-card booking-form-card" onSubmit={handleSubmit}>
          <div className="booking-steps">
            <span className={`booking-step ${form.doctorProfileId ? "booking-step--active" : ""}`}>1. Doctor</span>
            <span className={`booking-step ${form.appointmentDate ? "booking-step--active" : ""}`}>2. Date</span>
            <span className={`booking-step ${form.timeSlot ? "booking-step--active" : ""}`}>3. Time Slot</span>
            <span className={`booking-step ${form.reason.trim() ? "booking-step--active" : ""}`}>4. Reason</span>
          </div>

          <div className="form-grid two-col booking-form-grid">
            <label className="span-2">
              Doctor
              <select
                name="doctorProfileId"
                value={form.doctorProfileId}
                onChange={handleChange}
                required
                disabled={loadingDoctors}
              >
                <option value="">
                  {loadingDoctors ? "Loading doctors..." : "Select a doctor"}
                </option>
                {doctors.map((doctor) => (
                  <option key={doctor._id} value={doctor._id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Appointment Date
              <input
                type="date"
                name="appointmentDate"
                value={form.appointmentDate}
                onChange={handleChange}
                min={minBookingDate}
                required
              />
            </label>

            <div className="booking-slot-meta">
              <p className="booking-field-label">Slot Availability</p>
              <p className="booking-slot-status">{slotStatusText}</p>
            </div>

            <div className="booking-slot-picker span-2">
              <p className="booking-field-label">Time Slot</p>
              <input type="hidden" name="timeSlot" value={form.timeSlot} />

              {!form.doctorProfileId || !form.appointmentDate ? (
                <div className="slot-grid-empty">Select a doctor and date to load slots.</div>
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
                      className={`slot-chip ${form.timeSlot === slot ? "slot-chip--active" : ""}`}
                      onClick={() => selectSlot(slot)}
                      aria-pressed={form.timeSlot === slot}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <label className="span-2">
              Consultation Reason
              <textarea
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows="4"
                placeholder="Describe symptoms, concerns, or what you want to discuss"
                required
              />
            </label>
          </div>

          {slotError && <p className="form-error">{slotError}</p>}
          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <div className="booking-footer">
            <p className="booking-note">Your selected slot is temporarily reserved once booking is submitted.</p>
            <button className="btn btn-primary booking-submit-btn" type="submit" disabled={saving || !form.timeSlot}>
              {saving ? "Booking..." : "Confirm Appointment"}
            </button>
          </div>
        </form>

        <aside className="booking-side">
          <div className="panel booking-summary-card">
            <h3>Booking Summary</h3>
            <div className="booking-summary-grid">
              <div className="booking-summary-row">
                <span className="booking-summary-label">Doctor</span>
                <span className={selectedDoctor ? "booking-summary-value" : "booking-summary-value booking-summary-value--muted"}>
                  {selectedDoctor ? selectedDoctor.name : "Not selected"}
                </span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Specialization</span>
                <span className={selectedDoctor?.specialization ? "booking-summary-value" : "booking-summary-value booking-summary-value--muted"}>
                  {selectedDoctor?.specialization || "Not selected"}
                </span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Date</span>
                <span className={form.appointmentDate ? "booking-summary-value" : "booking-summary-value booking-summary-value--muted"}>
                  {formatAppointmentDate(form.appointmentDate)}
                </span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Time Slot</span>
                <span className={form.timeSlot ? "booking-summary-value" : "booking-summary-value booking-summary-value--muted"}>
                  {form.timeSlot || "Not selected"}
                </span>
              </div>
              <div className="booking-summary-row">
                <span className="booking-summary-label">Consultation Fee</span>
                <span className={selectedDoctor ? "booking-summary-value" : "booking-summary-value booking-summary-value--muted"}>
                  {selectedDoctor ? `LKR ${selectedDoctor.consultationFee || 0}` : "Not available"}
                </span>
              </div>
            </div>
          </div>

          <div className="panel booking-help-card">
            <h3>Before You Submit</h3>
            <ul className="booking-help-list">
              <li>Keep your reason brief and medically relevant.</li>
              <li>Choose a slot you can definitely attend.</li>
              <li>You can manage booking status from My Appointments.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default BookAppointment;

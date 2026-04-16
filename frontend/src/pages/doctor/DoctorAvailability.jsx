import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import { doctorService } from "../../services/doctorService";

const emptyRow = { date: "", slots: "" };

const toInputDate = (value) => {
  if (!value) return "";
  const asText = value.toString().trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(asText)) return asText;

  const parsed = new Date(asText);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const getTodayDate = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const getSlotCount = (slotsText) =>
  slotsText
    .split(",")
    .map((slot) => slot.trim())
    .filter(Boolean).length;

const formatDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
};

function DoctorAvailability() {
  const [rows, setRows] = useState([emptyRow]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileExists, setProfileExists] = useState(true);
  const [legacyCount, setLegacyCount] = useState(0);
  const minDate = useMemo(() => getTodayDate(), []);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await doctorService.getMyProfile();
        setProfileExists(true);

        const availabilityEntries = Array.isArray(data.availability) ? data.availability : [];
        let legacyEntries = 0;

        const mapped = availabilityEntries
          .map((item) => {
            const date = toInputDate(item?.date);
            if (!date) {
              legacyEntries += 1;
              return null;
            }

            return {
              date,
              slots: (item.slots || []).join(", ")
            };
          })
          .filter(Boolean);

        setRows(mapped.length > 0 ? mapped : [emptyRow]);
        setLegacyCount(legacyEntries);
      } catch (err) {
        setProfileExists(false);
        setError(err.response?.data?.message || "Doctor profile not found.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((prev) => [...prev, { ...emptyRow }]);
  };

  const removeRow = (index) => {
    setRows((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, rowIndex) => rowIndex !== index);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const availability = rows
      .filter((row) => row.date.trim())
      .map((row) => ({
        date: row.date.trim(),
        slots: row.slots
          .split(",")
          .map((slot) => slot.trim())
          .filter(Boolean)
      }));

    if (availability.length === 0) {
      setError("Add at least one dated slot entry.");
      return;
    }

    if (availability.some((entry) => entry.slots.length === 0)) {
      setError("Each selected date must include at least one slot.");
      return;
    }

    setSaving(true);

    try {
      const data = await doctorService.updateMyAvailability({ availability });
      setSuccess(data.message || "Availability updated successfully.");
      setLegacyCount(0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update availability.");
    } finally {
      setSaving(false);
    }
  };

  const configuredDateCount = rows.filter((row) => row.date.trim()).length;
  const configuredSlotCount = rows.reduce((total, row) => total + getSlotCount(row.slots), 0);

  const upcomingEntries = rows
    .filter((row) => row.date.trim())
    .map((row) => ({ date: row.date.trim(), slotCount: getSlotCount(row.slots) }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  return (
    <section className="dashboard-page doctor-page doctor-availability-page">
      <PageHeader
        title="Availability"
        subtitle="Publish date-specific time slots. Patients can only book slots you list here."
      />

      {loading && <Loader label="Loading availability..." />}

      {!loading && !profileExists && (
        <EmptyState
          title="Profile not available"
          message={error || "Your doctor profile is not created yet by admin."}
        />
      )}

      {!loading && profileExists && (
        <div className="availability-layout">
          <form className="form-card availability-form-card" onSubmit={handleSubmit}>
            {legacyCount > 0 && (
              <p className="form-error">
                {legacyCount} legacy day-based availability entr{legacyCount === 1 ? "y" : "ies"} found. Save dated
                availability to replace them.
              </p>
            )}

            <div className="availability-toolbar">
              <div className="availability-kpis">
                <div className="availability-kpi">
                  <strong>{configuredDateCount}</strong>
                  <span>Dates</span>
                </div>
                <div className="availability-kpi">
                  <strong>{configuredSlotCount}</strong>
                  <span>Slots</span>
                </div>
              </div>

              <div className="availability-toolbar-actions">
                <button type="button" className="btn btn-outline availability-add-btn" onClick={addRow}>
                  Add Date
                </button>
              </div>
            </div>

            <div className="availability-grid doctor-availability-grid">
              {rows.map((row, index) => (
                <article className="availability-row-card" key={`${row.date || "new"}-${index}`}>
                  <div className="availability-row-head">
                    <h3>Availability Entry {index + 1}</h3>
                    <button
                      type="button"
                      className="btn btn-outline btn-small availability-remove-btn"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="availability-row">
                    <label className="availability-field">
                      <span>Date</span>
                      <input
                        type="date"
                        className="availability-input"
                        min={minDate}
                        value={row.date}
                        onChange={(event) => updateRow(index, "date", event.target.value)}
                      />
                    </label>

                    <label className="availability-field">
                      <span>Time Slots</span>
                      <input
                        type="text"
                        className="availability-input"
                        placeholder="09:00 AM, 10:30 AM, 02:00 PM"
                        value={row.slots}
                        onChange={(event) => updateRow(index, "slots", event.target.value)}
                      />
                    </label>
                  </div>

                  <p className="availability-row-note">Use comma-separated slots for the selected date.</p>
                </article>
              ))}
            </div>

            <div className="availability-actions">
              <button type="submit" className="btn btn-primary availability-submit-btn" disabled={saving}>
                {saving ? "Saving..." : "Save Availability"}
              </button>
            </div>

            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}
          </form>

          <aside className="availability-side">
            <div className="panel">
              <h3>Booking Logic</h3>
              <ul className="profile-tip-list">
                <li>Only the listed dated slots are shown on doctor profile and booking pages.</li>
                <li>After a patient books a slot, that slot is hidden until the booking is cancelled.</li>
                <li>Keep slot times in a consistent format so patients see clean options.</li>
              </ul>
            </div>

            <div className="panel">
              <h3>Upcoming Dates</h3>
              {upcomingEntries.length === 0 ? (
                <p className="doctor-muted-note">No upcoming availability entries.</p>
              ) : (
                <ul className="doctor-slot-preview-list">
                  {upcomingEntries.map((entry, index) => (
                    <li key={`${entry.date}-${index}`}>
                      <span>{formatDateLabel(entry.date)}</span>
                      <strong>
                        {entry.slotCount} slot{entry.slotCount === 1 ? "" : "s"}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default DoctorAvailability;

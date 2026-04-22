import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import { doctorService } from "../../services/doctorService";

function DoctorProfile() {
  const [form, setForm] = useState({
    specialization: "",
    experience: 0,
    hospital: "",
    consultationFee: 0
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileExists, setProfileExists] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await doctorService.getMyProfile();
        setProfileExists(true);
        setForm({
          specialization: data.specialization || "",
          experience: data.experience || 0,
          hospital: data.hospital || "",
          consultationFee: data.consultationFee || 0
        });
      } catch (err) {
        setProfileExists(false);
        setError(err.response?.data?.message || "Doctor profile was not found.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const payload = {
        specialization: form.specialization,
        experience: Number(form.experience),
        hospital: form.hospital,
        consultationFee: Number(form.consultationFee)
      };
      const data = await doctorService.updateMyProfile(payload);
      setSuccess(data.message || "Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const completion = useMemo(() => {
    const checks = [
      Boolean(form.specialization.trim()),
      Number(form.experience) > 0,
      Boolean(form.hospital.trim()),
      Number(form.consultationFee) > 0
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  return (
    <section className="dashboard-page doctor-page doctor-profile-page">
      <PageHeader
        title="My Profile"
        subtitle="Keep your professional details complete and accurate for patients."
      />

      {loading && <Loader label="Loading profile..." />}

      {!loading && !profileExists && (
        <EmptyState
          title="Profile not available"
          message={error || "Your doctor profile is not yet created by admin."}
        />
      )}

      {!loading && profileExists && (
        <div className="profile-layout">
          <form className="form-card profile-form-card doctor-profile-form" onSubmit={handleSubmit}>
            <div className="profile-form-head">
              <h2>Professional Information</h2>
              <p>These details are shown when patients view your profile and book consultations.</p>
            </div>

            <div className="form-grid two-col doctor-profile-grid">
              <label className="required">
                Specialization
                <input
                  type="text"
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  placeholder="Cardiology"
                  required
                />
              </label>

              <label className="required">
                Experience (Years)
                <input
                  type="number"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </label>

              <label className="required">
                Hospital
                <input
                  type="text"
                  name="hospital"
                  value={form.hospital}
                  onChange={handleChange}
                  placeholder="General Hospital"
                  required
                />
              </label>

              <label className="required">
                Consultation Fee (LKR)
                <input
                  type="number"
                  name="consultationFee"
                  value={form.consultationFee}
                  onChange={handleChange}
                  min="0"
                  required
                />
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <div className="profile-form-footer">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          <aside className="profile-side">
            <div className="panel profile-progress-card">
              <h3>Profile Completion</h3>
              <p>A complete profile helps patients trust your consultation details before booking.</p>
              <div className="profile-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}>
                <div className="profile-progress-fill" style={{ width: `${completion}%` }} />
              </div>
              <p className="doctor-profile-progress-text">{completion}% completed</p>
            </div>

            <div className="panel">
              <h3>Quality Checklist</h3>
              <ul className="profile-tip-list">
                <li>Use a clear specialization label patients can easily understand.</li>
                <li>Keep hospital details current if you practice in multiple locations.</li>
                <li>Review consultation fee periodically to reflect current rates.</li>
              </ul>
            </div>

            <div className="panel doctor-profile-preview">
              <h3>Current Preview</h3>
              <div className="doctor-summary-list">
                <div className="doctor-summary-item">
                  <span>Specialization</span>
                  <strong>{form.specialization || "Not set"}</strong>
                </div>
                <div className="doctor-summary-item">
                  <span>Experience</span>
                  <strong>{Number(form.experience) || 0} years</strong>
                </div>
                <div className="doctor-summary-item">
                  <span>Hospital</span>
                  <strong>{form.hospital || "Not set"}</strong>
                </div>
                <div className="doctor-summary-item">
                  <span>Consultation Fee</span>
                  <strong>
                    {Number(form.consultationFee) > 0
                      ? `LKR ${Number(form.consultationFee).toLocaleString()}`
                      : "Not set"}
                  </strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default DoctorProfile;

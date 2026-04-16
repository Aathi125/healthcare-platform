import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import { patientService } from "../../services/patientService";

const initialForm = {
  name: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  medicalHistory: ""
};

function PatientProfile() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const filledFields = Object.values(form).filter((value) => value && value.toString().trim() !== "").length;
  const completion = Math.round((filledFields / Object.keys(form).length) * 100);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await patientService.getMyProfile();
        setForm({
          name: data.name || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          address: data.address || "",
          medicalHistory: data.medicalHistory || ""
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile.");
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
      const data = await patientService.updateMyProfile(form);
      setSuccess(data.message || "Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="dashboard-page">
      <PageHeader
        title="My Profile"
        subtitle="Keep your contact details and medical history complete for better care."
      />

      {loading && <p>Loading profile...</p>}

      {!loading && (
        <div className="profile-layout">
          <form className="form-card profile-form-card" onSubmit={handleSubmit}>
            <div className="profile-form-head">
              <h2>Personal Information</h2>
              <p>Use accurate information to help doctors make better decisions.</p>
            </div>

            <div className="form-grid two-col">
              <label>
                Full Name
                <input type="text" name="name" value={form.name} onChange={handleChange} required />
              </label>

              <label>
                Phone
                <input type="text" name="phone" value={form.phone} onChange={handleChange} />
              </label>

              <label>
                Date of Birth
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
              </label>

              <label>
                Gender
                <select name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="span-2">
                Address
                <input type="text" name="address" value={form.address} onChange={handleChange} />
              </label>

              <label className="span-2">
                Medical History
                <textarea
                  name="medicalHistory"
                  value={form.medicalHistory}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Allergies, chronic conditions, and previous treatments"
                />
              </label>
            </div>

            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <div className="profile-form-footer">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>

          <aside className="profile-side">
            <div className="panel profile-progress-card">
              <h3>Profile Completion</h3>
              <p>{completion}% completed</p>
              <div className="profile-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}>
                <div className="profile-progress-fill" style={{ width: `${completion}%` }} />
              </div>
            </div>

            <div className="panel profile-help-card">
              <h3>Tips</h3>
              <ul className="profile-tip-list">
                <li>Keep your phone number updated for appointment reminders.</li>
                <li>Add medical history details for faster consultations.</li>
                <li>Review your profile after major health changes.</li>
              </ul>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default PatientProfile;

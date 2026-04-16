import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { authService } from "../../services/authService";

function CreateDoctorAccount() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdDoctor, setCreatedDoctor] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setCreatedDoctor(null);
    setSaving(true);

    try {
      const data = await authService.createDoctorAccount(form);
      setCreatedDoctor(data.user);
      setForm({ name: "", email: "", password: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Doctor account creation failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="dashboard-page admin-account-page">
      <PageHeader
        title="Create Doctor Account"
        subtitle="Step 1: Create doctor login account in auth-service."
        action={
          <Link to="/admin/create-doctor-profile" className="btn btn-outline btn-small">
            Open Step 2
          </Link>
        }
      />

      <div className="profile-layout admin-account-layout">
        <form className="form-card profile-form-card admin-account-form" onSubmit={handleSubmit}>
          <div className="profile-form-head admin-account-form-head">
            <span className="eyebrow">Admin Setup</span>
            <h2>Doctor Login Credentials</h2>
            <p>
              Create the doctor&apos;s sign-in account first. The new account will appear in Step 2
              so the profile can be linked without typing a raw user ID.
            </p>
          </div>

          <div className="admin-account-summary">
            <div className="admin-account-summary-card">
              <span>Step</span>
              <strong>1 of 2</strong>
            </div>
            <div className="admin-account-summary-card">
              <span>Role</span>
              <strong>DOCTOR</strong>
            </div>
            <div className="admin-account-summary-card">
              <span>Next Output</span>
              <strong>User ID</strong>
            </div>
          </div>

          <div className="form-grid two-col admin-account-grid">
            <label className="required">
              Doctor Name
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Dr. Sarah Perera"
                required
              />
            </label>

            <label className="required">
              Doctor Email
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="doctor@hospital.com"
                required
              />
            </label>

            <label className="span-2 required">
              Temporary Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a temporary password"
                required
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="profile-form-footer admin-account-form-footer">
            <p className="admin-account-inline-note">
              Share the temporary password securely. The doctor can use it for the first sign-in.
            </p>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Creating..." : "Create Doctor Account"}
            </button>
          </div>
        </form>

        <aside className="profile-side admin-account-side">
          <div
            className={`panel admin-account-status-panel${
              createdDoctor ? " success-panel admin-account-status-panel--success" : ""
            }`}
          >
            <div className="admin-account-status-head">
              <div>
                <h3>{createdDoctor ? "Doctor account created" : "Awaiting submission"}</h3>
                <p>
                  {createdDoctor
                    ? "Use these values in the next step to connect the doctor profile."
                    : "The generated account details will appear here after successful creation."}
                </p>
              </div>
              {createdDoctor && <span className="admin-account-role-badge">Ready</span>}
            </div>

            <div className="doctor-summary-list">
              <div className="doctor-summary-item">
                <span>User ID</span>
                <strong>{createdDoctor?.id || "Not generated yet"}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Email</span>
                <strong>{createdDoctor?.email || form.email || "Not provided yet"}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Role</span>
                <strong>{createdDoctor?.role || "DOCTOR"}</strong>
              </div>
            </div>

            {createdDoctor && (
              <Link to="/admin/create-doctor-profile" className="btn btn-primary admin-account-next">
                Continue to Create Profile
              </Link>
            )}
          </div>

          <div className="panel admin-account-help-panel">
            <h3>Onboarding Sequence</h3>
            <ul className="admin-account-checklist">
              <li>Create the doctor login account on this page.</li>
              <li>Select the new doctor account from the Step 2 account list.</li>
              <li>Complete profile details so appointments map to the correct login.</li>
            </ul>
          </div>

          <div className="panel admin-account-help-panel">
            <h3>Credential Checklist</h3>
            <ul className="admin-account-checklist">
              <li>Use the doctor&apos;s working email address.</li>
              <li>Set a temporary password that can be shared privately.</li>
              <li>Confirm the account appears in Step 2 before creating the doctor profile.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreateDoctorAccount;

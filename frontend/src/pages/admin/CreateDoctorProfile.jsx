import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import { authService } from "../../services/authService";
import { doctorService } from "../../services/doctorService";

const initialForm = {
  userId: "",
  specialization: "",
  experience: 0,
  hospital: "",
  consultationFee: 0,
  availabilityText: "2026-04-01: 09:00 AM, 10:00 AM"
};

const parseAvailabilityText = (text) => {
  if (!text.trim()) return [];

  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf(":");
      if (separatorIndex === -1) {
        return null;
      }

      const dateOrDayPart = line.slice(0, separatorIndex).trim();
      const slotsPart = line.slice(separatorIndex + 1).trim();
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(dateOrDayPart);

      return {
        date: isDate ? dateOrDayPart : "",
        day: isDate ? "" : dateOrDayPart,
        slots: slotsPart
          .split(",")
          .map((slot) => slot.trim())
          .filter(Boolean)
      };
    })
    .filter((item) => item && (item.date || item.day));
};

function CreateDoctorProfile() {
  const [form, setForm] = useState(initialForm);
  const [doctorAccounts, setDoctorAccounts] = useState([]);
  const [existingProfiles, setExistingProfiles] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedAccount = useMemo(
    () => doctorAccounts.find((account) => account.id === form.userId) || null,
    [doctorAccounts, form.userId]
  );

  const availableAccounts = useMemo(() => {
    const linkedUserIds = new Set(
      existingProfiles
        .map((profile) => (profile.userId || "").toString().trim())
        .filter(Boolean)
    );

    return doctorAccounts.filter(
      (account) => !linkedUserIds.has(account.id) || account.id === form.userId
    );
  }, [doctorAccounts, existingProfiles, form.userId]);

  const loadDoctorAccountOptions = async () => {
    setLoadingAccounts(true);
    setAccountsError("");

    try {
      const [accountsData, profilesData] = await Promise.all([
        authService.getDoctorAccounts(),
        doctorService.getDoctors()
      ]);

      const accounts = Array.isArray(accountsData) ? accountsData : [];
      const profiles = Array.isArray(profilesData) ? profilesData : [];

      setDoctorAccounts(accounts);
      setExistingProfiles(profiles);

      setForm((prev) => {
        if (!prev.userId) return prev;

        const matchingAccount = accounts.find((account) => account.id === prev.userId);
        if (matchingAccount) {
          return prev;
        }

        return { ...prev, userId: "" };
      });
    } catch (err) {
      setDoctorAccounts([]);
      setExistingProfiles([]);
      setAccountsError(err.response?.data?.message || "Failed to load doctor accounts.");
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadDoctorAccountOptions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAccountSelect = (account) => {
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, userId: account.id }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAccount) {
      setError("Select a doctor account from the list before creating the profile.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        userId: selectedAccount.id,
        name: selectedAccount.name,
        email: selectedAccount.email,
        specialization: form.specialization,
        experience: Number(form.experience),
        hospital: form.hospital,
        consultationFee: Number(form.consultationFee),
        availability: parseAvailabilityText(form.availabilityText)
      };

      const data = await doctorService.createDoctorProfile(payload);
      setSuccess(data.message || "Doctor profile created successfully.");
      setForm(initialForm);
      await loadDoctorAccountOptions();
    } catch (err) {
      setError(err.response?.data?.message || "Doctor profile creation failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="dashboard-page admin-profile-page">
      <PageHeader
        title="Create Doctor Profile"
        subtitle="Step 2: Select a doctor account and create its doctor profile."
        action={
          <Link to="/admin/create-doctor-account" className="btn btn-outline btn-small">
            Open Step 1
          </Link>
        }
      />

      <div className="profile-layout admin-profile-layout">
        <form className="form-card profile-form-card admin-profile-form" onSubmit={handleSubmit}>
          <div className="profile-form-head admin-profile-form-head">
            <span className="eyebrow">Profile Setup</span>
            <h2>Doctor Profile Details</h2>
            <p>
              Select a doctor account from the list. The profile will be linked automatically
              without entering a raw user ID.
            </p>
          </div>

          <div className="panel admin-profile-selected-panel">
            <div className="doctor-side-head">
              <h2>Selected Doctor Account</h2>
              {selectedAccount && <span>Ready</span>}
            </div>

            {!selectedAccount && (
              <p className="doctor-empty-note">
                Pick one of the available doctor accounts from the right-side list to continue.
              </p>
            )}

            {selectedAccount && (
              <div className="doctor-summary-list">
                <div className="doctor-summary-item">
                  <span>Name</span>
                  <strong>{selectedAccount.name}</strong>
                </div>
                <div className="doctor-summary-item">
                  <span>Email</span>
                  <strong>{selectedAccount.email}</strong>
                </div>
                <div className="doctor-summary-item">
                  <span>User ID</span>
                  <strong>{selectedAccount.id}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="form-grid two-col admin-profile-grid">
            <label>
              Doctor Name
              <input
                type="text"
                value={selectedAccount?.name || ""}
                placeholder="Select a doctor account"
                readOnly
              />
            </label>

            <label>
              Doctor Email
              <input
                type="email"
                value={selectedAccount?.email || ""}
                placeholder="Select a doctor account"
                readOnly
              />
            </label>

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

            <label>
              Experience (Years)
              <input
                type="number"
                min="0"
                name="experience"
                value={form.experience}
                onChange={handleChange}
              />
            </label>

            <label>
              Consultation Fee (LKR)
              <input
                type="number"
                min="0"
                name="consultationFee"
                value={form.consultationFee}
                onChange={handleChange}
              />
            </label>

            <label className="span-2">
              Hospital
              <input
                type="text"
                name="hospital"
                value={form.hospital}
                onChange={handleChange}
                placeholder="General Hospital"
              />
            </label>

            <label className="span-2">
              Availability (one line per entry, format: YYYY-MM-DD: slot1, slot2)
              <textarea
                name="availabilityText"
                value={form.availabilityText}
                onChange={handleChange}
                rows="5"
              />
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <div className="profile-form-footer admin-profile-form-footer">
            <p className="admin-account-inline-note">
              The selected doctor account controls the linked `userId`, name, and email.
            </p>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || !selectedAccount}
            >
              {saving ? "Creating..." : "Create Doctor Profile"}
            </button>
          </div>
        </form>

        <aside className="profile-side admin-profile-side">
          <div className="panel admin-profile-accounts-panel">
            <div className="doctor-side-head">
              <h2>Available Doctor Accounts</h2>
              <span>{loadingAccounts ? "..." : availableAccounts.length}</span>
            </div>

            <p className="doctor-empty-note">
              Choose an unlinked doctor account to attach this profile.
            </p>

            {loadingAccounts && <Loader label="Loading doctor accounts..." />}
            {!loadingAccounts && accountsError && <p className="form-error">{accountsError}</p>}

            {!loadingAccounts && !accountsError && availableAccounts.length === 0 && (
              <div className="admin-profile-empty">
                <p className="doctor-empty-note">
                  There are no unlinked doctor accounts available right now.
                </p>
                <Link to="/admin/create-doctor-account" className="btn btn-primary">
                  Create Doctor Account
                </Link>
              </div>
            )}

            {!loadingAccounts && !accountsError && availableAccounts.length > 0 && (
              <div className="admin-profile-account-list">
                {availableAccounts.map((account) => {
                  const isSelected = account.id === form.userId;

                  return (
                    <button
                      key={account.id}
                      type="button"
                      className={`admin-profile-account-card${
                        isSelected ? " is-selected" : ""
                      }`}
                      onClick={() => handleAccountSelect(account)}
                    >
                      <div className="admin-profile-account-meta">
                        <strong>{account.name}</strong>
                        <span>{account.email}</span>
                        <code>{account.id}</code>
                      </div>
                      <span className="admin-profile-account-cta">
                        {isSelected ? "Selected" : "Select"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="panel admin-profile-help-panel">
            <h3>Onboarding Sequence</h3>
            <ul className="admin-account-checklist">
              <li>Create the doctor login account in Step 1.</li>
              <li>Select that account from the available list on this page.</li>
              <li>Complete specialization, hospital, fee, and availability details.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreateDoctorProfile;

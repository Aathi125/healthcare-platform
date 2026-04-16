import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import PageHeader from "../../components/PageHeader";
import { patientService } from "../../services/patientService";

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPrescriptions = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await patientService.getMyPrescriptions();
        setPrescriptions(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load prescriptions.");
        setPrescriptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadPrescriptions();
  }, []);

  const totalMedicines = useMemo(
    () =>
      prescriptions.reduce(
        (sum, prescription) => sum + (Array.isArray(prescription.medicines) ? prescription.medicines.length : 0),
        0
      ),
    [prescriptions]
  );

  const doctorCount = useMemo(
    () => new Set(prescriptions.map((item) => item.doctorName).filter(Boolean)).size,
    [prescriptions]
  );

  const latestIssuedAt = prescriptions[0]?.issuedDate ? formatDateTime(prescriptions[0].issuedDate) : "No prescriptions yet";

  return (
    <section className="dashboard-page patient-prescriptions-page">
      <PageHeader
        title="My Prescriptions"
        subtitle="Review prescribed medicines, consultation notes, and issue dates in one place."
      />

      {error && <p className="form-error">{error}</p>}

      <div className="patient-resource-layout">
        <div className="patient-resource-main">
          <div className="panel patient-resource-panel">
            <div className="patient-resource-panel-head">
              <div>
                <h2>Prescription History</h2>
                <p>Each card groups the doctor, issued date, medicines, and notes for that prescription.</p>
              </div>
              <span>{loading ? "..." : prescriptions.length}</span>
            </div>

            {loading && <Loader label="Loading prescriptions..." />}

            {!loading && prescriptions.length === 0 && (
              <EmptyState
                title="No prescriptions found"
                message="Your issued prescriptions will appear here after a doctor completes a consultation record."
              />
            )}

            {!loading && prescriptions.length > 0 && (
              <div className="patient-prescription-list">
                {prescriptions.map((item) => {
                  const medicines = Array.isArray(item.medicines) ? item.medicines : [];

                  return (
                    <article className="patient-prescription-card" key={item._id}>
                      <div className="patient-prescription-card-head">
                        <div className="patient-prescription-meta">
                          <h3>Dr. {item.doctorName || "Doctor"}</h3>
                          <p>Issued {formatDateTime(item.issuedDate)}</p>
                        </div>

                        <div className="patient-chip-row">
                          <span className="patient-chip">
                            {item.appointmentId ? "Appointment Linked" : "Direct Note"}
                          </span>
                          <span className="patient-chip">
                            {medicines.length} medicine{medicines.length === 1 ? "" : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="doctor-summary-list">
                        <div className="doctor-summary-item">
                          <span>Appointment ID</span>
                          <strong>{item.appointmentId || "Not linked"}</strong>
                        </div>
                        <div className="doctor-summary-item">
                          <span>Doctor</span>
                          <strong>{item.doctorName || "Unavailable"}</strong>
                        </div>
                      </div>

                      <div className="patient-medicine-grid">
                        {medicines.map((medicine, index) => (
                          <div className="patient-medicine-item" key={`${item._id}-${medicine.name}-${index}`}>
                            <strong>{medicine.name}</strong>
                            <span>{medicine.dosage || "Dosage not specified"}</span>
                            <p>{medicine.instructions || "No additional instructions."}</p>
                          </div>
                        ))}
                      </div>

                      <div className="patient-prescription-note">
                        <span>Clinical Notes</span>
                        <p>{item.notes || "No consultation notes were attached to this prescription."}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <aside className="patient-resource-side">
          <div className="panel patient-resource-summary-panel">
            <h3>Prescription Summary</h3>
            <div className="doctor-summary-list">
              <div className="doctor-summary-item">
                <span>Total Prescriptions</span>
                <strong>{loading ? "..." : prescriptions.length}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Total Medicines</span>
                <strong>{loading ? "..." : totalMedicines}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Doctors Involved</span>
                <strong>{loading ? "..." : doctorCount}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Latest Issued</span>
                <strong>{loading ? "Loading..." : latestIssuedAt}</strong>
              </div>
            </div>
          </div>

          <div className="panel patient-resource-help-panel">
            <h3>Use This Page</h3>
            <ul className="profile-tip-list">
              <li>Check medicine dosage and instructions before each course.</li>
              <li>Keep prescription notes handy for follow-up appointments.</li>
              <li>Compare issue dates to understand your treatment timeline.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default PatientPrescriptions;

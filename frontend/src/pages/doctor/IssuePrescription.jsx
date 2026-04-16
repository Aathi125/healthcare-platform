import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { patientService } from "../../services/patientService";

const emptyMedicine = { name: "", dosage: "", instructions: "" };

const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
};

function IssuePrescription() {
  const [searchParams] = useSearchParams();

  const prefilledPatientId = searchParams.get("patientId") || "";
  const prefilledAppointmentId = searchParams.get("appointmentId") || "";

  const [form, setForm] = useState({
    patientId: prefilledPatientId,
    appointmentId: prefilledAppointmentId,
    notes: "",
    medicines: [{ ...emptyMedicine }]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState([]);
  const [patientReports, setPatientReports] = useState([]);
  const hasPatientContext = Boolean(form.patientId.trim());

  const loadHistory = async () => {
    try {
      const data = await patientService.getDoctorPrescriptions();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    }
  };

  const loadPatientReports = async (patientId) => {
    if (!patientId) {
      setPatientReports([]);
      return;
    }

    try {
      const data = await patientService.getReportsByPatient(patientId);
      setPatientReports(Array.isArray(data) ? data : []);
    } catch {
      setPatientReports([]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (prefilledPatientId) {
      loadPatientReports(prefilledPatientId);
    }
  }, [prefilledPatientId]);

  const updateMedicine = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      )
    }));
  };

  const addMedicine = () => {
    setForm((prev) => ({ ...prev, medicines: [...prev.medicines, { ...emptyMedicine }] }));
  };

  const removeMedicine = (index) => {
    setForm((prev) => {
      if (prev.medicines.length === 1) return prev;
      return {
        ...prev,
        medicines: prev.medicines.filter((_, medicineIndex) => medicineIndex !== index)
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!hasPatientContext) {
      setError("Open this page from an appointment to issue a prescription.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        patientId: form.patientId.trim(),
        appointmentId: form.appointmentId.trim(),
        notes: form.notes.trim(),
        medicines: form.medicines.map((medicine) => ({
          name: medicine.name.trim(),
          dosage: medicine.dosage.trim(),
          instructions: medicine.instructions.trim()
        }))
      };

      const data = await patientService.issuePrescription(payload);
      setSuccess(data.message || "Prescription issued successfully.");
      setForm((prev) => ({ ...prev, notes: "", medicines: [{ ...emptyMedicine }] }));
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to issue prescription.");
    } finally {
      setSaving(false);
    }
  };

  const downloadReport = async (report) => {
    setError("");

    try {
      const blob = await patientService.downloadReport(report._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.originalName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download report.");
    }
  };

  return (
    <section className="dashboard-page doctor-page doctor-prescription-page">
      <PageHeader
        title="Issue Prescription"
        subtitle="Create and store digital prescriptions with clear medicine instructions for each patient."
      />

      <div className="doctor-prescription-layout">
        <form className="form-card doctor-prescription-form" onSubmit={handleSubmit}>
          <div className="doctor-form-section">
            <div className="doctor-form-section-head">
              <h2>Consultation Context</h2>
              {hasPatientContext ? (
                <button
                  className="btn btn-outline btn-small"
                  type="button"
                  onClick={() => loadPatientReports(form.patientId.trim())}
                >
                  Load Reports
                </button>
              ) : (
                <Link className="btn btn-outline btn-small" to="/doctor/appointments">
                  Go to Appointments
                </Link>
              )}
            </div>

            <div className="form-grid two-col">
              <div className="doctor-summary-item">
                <span>Patient Link</span>
                <strong>{hasPatientContext ? "Attached from appointment" : "Not selected"}</strong>
              </div>

              <div className="doctor-summary-item">
                <span>Appointment Link</span>
                <strong>{form.appointmentId ? "Attached" : "Not attached"}</strong>
              </div>

              <label className="span-2">
                Clinical Notes
                <textarea
                  rows="4"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Diagnosis, follow-up instructions, and caution notes"
                />
              </label>
            </div>
          </div>

          <div className="doctor-form-section">
            <div className="doctor-form-section-head">
              <h2>Medicine Plan</h2>
              <button className="btn btn-outline btn-small" type="button" onClick={addMedicine}>
                Add Medicine
              </button>
            </div>

            <div className="doctor-medicine-list">
              {form.medicines.map((medicine, index) => (
                <article className="doctor-medicine-card" key={`medicine-${index}`}>
                  <div className="doctor-medicine-card-head">
                    <h3>Medicine {index + 1}</h3>
                    <button className="btn btn-outline btn-small" type="button" onClick={() => removeMedicine(index)}>
                      Remove
                    </button>
                  </div>

                  <div className="form-grid three-col doctor-medicine-fields">
                    <label className="required">
                      Name
                      <input
                        type="text"
                        value={medicine.name}
                        onChange={(event) => updateMedicine(index, "name", event.target.value)}
                        required
                      />
                    </label>

                    <label>
                      Dosage
                      <input
                        type="text"
                        value={medicine.dosage}
                        onChange={(event) => updateMedicine(index, "dosage", event.target.value)}
                        placeholder="1 tablet twice daily"
                      />
                    </label>

                    <label>
                      Instructions
                      <input
                        type="text"
                        value={medicine.instructions}
                        onChange={(event) => updateMedicine(index, "instructions", event.target.value)}
                        placeholder="After meals"
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}
          {success && <p className="form-success">{success}</p>}

          <div className="doctor-prescription-submit">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Issuing..." : "Issue Prescription"}
            </button>
          </div>
        </form>

        <aside className="doctor-prescription-side">
          <div className="panel doctor-side-panel">
            <div className="doctor-side-head">
              <h2>Patient Reports</h2>
              <span>{patientReports.length}</span>
            </div>

            {patientReports.length === 0 && (
              <p className="doctor-empty-note">
                {hasPatientContext
                  ? "No reports found for the selected patient."
                  : "Open this page from an appointment to load patient reports."}
              </p>
            )}

            {patientReports.length > 0 && (
              <div className="doctor-report-list">
                {patientReports.map((report) => (
                  <article className="doctor-report-card" key={report._id}>
                    <div className="doctor-report-meta">
                      <h3>{report.title || "Medical Report"}</h3>
                      <p>{report.originalName}</p>
                      <p className="doctor-report-date">Uploaded: {formatDateTime(report.createdAt)}</p>
                    </div>
                    <button className="btn btn-outline btn-small" type="button" onClick={() => downloadReport(report)}>
                      Download
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel doctor-side-panel">
            <div className="doctor-side-head">
              <h2>Issued Prescriptions</h2>
              <span>{history.length}</span>
            </div>

            {history.length === 0 && <p className="doctor-empty-note">No prescriptions issued yet.</p>}

            {history.length > 0 && (
              <div className="doctor-history-list">
                {history.map((item) => (
                  <article className="doctor-history-card" key={item._id}>
                    <h3>{item.patientName || "Patient"}</h3>
                    <p>Appointment: {item.appointmentId || "N/A"}</p>
                    <p className="doctor-history-date">Issued: {formatDateTime(item.issuedDate)}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default IssuePrescription;

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

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "Unknown size";

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

function PatientReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ title: "", description: "", file: null });

  const loadReports = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await patientService.getMyReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports.");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const totalStorage = useMemo(
    () => reports.reduce((sum, report) => sum + (Number(report.fileSize) || 0), 0),
    [reports]
  );

  const latestUpload = reports[0]?.createdAt ? formatDateTime(reports[0].createdAt) : "No uploads yet";

  const handleUpload = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.file) {
      setError("Please choose a file to upload.");
      return;
    }

    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("file", form.file);

    setUploading(true);

    try {
      const data = await patientService.uploadMyReport(payload);
      setSuccess(data.message || "Report uploaded successfully.");
      setForm({ title: "", description: "", file: null });
      await loadReports();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload report.");
    } finally {
      setUploading(false);
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
    <section className="dashboard-page patient-reports-page">
      <PageHeader
        title="My Medical Reports"
        subtitle="Upload lab results, scans, and supporting documents so they stay organized and easy to access."
      />

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <div className="patient-resource-layout">
        <div className="patient-resource-main">
          <form className="form-card patient-upload-form" onSubmit={handleUpload}>
            <div className="profile-form-head patient-upload-form-head">
              <span className="eyebrow">Documents</span>
              <h2>Upload New Report</h2>
              <p>Attach recent files before appointments so doctors can review them with the right context.</p>
            </div>

            <div className="form-grid two-col">
              <label>
                Report Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Blood Test / X-Ray"
                />
              </label>

              <label>
                File
                <input
                  type="file"
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, file: event.target.files?.[0] || null }))
                  }
                  required
                />
              </label>

              <label className="span-2">
                Description
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional details about this document"
                />
              </label>
            </div>

            <div className="profile-form-footer patient-upload-form-footer">
              <p className="patient-inline-note">
                {form.file
                  ? `Selected file: ${form.file.name}`
                  : "Choose a file to upload and keep it available for future consultations."}
              </p>

              <button className="btn btn-primary" type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Report"}
              </button>
            </div>
          </form>

          <div className="panel patient-resource-panel">
            <div className="patient-resource-panel-head">
              <div>
                <h2>Uploaded Reports</h2>
                <p>Download previously uploaded files or review when each report was added.</p>
              </div>
              <span>{loading ? "..." : reports.length}</span>
            </div>

            {loading && <Loader label="Loading reports..." />}

            {!loading && reports.length === 0 && (
              <EmptyState
                title="No reports uploaded yet"
                message="Once you upload a document, it will appear here with its file name, upload date, and download action."
              />
            )}

            {!loading && reports.length > 0 && (
              <div className="patient-report-list">
                {reports.map((report) => (
                  <article className="patient-report-card" key={report._id}>
                    <div className="patient-report-meta">
                      <h3>{report.title || "Medical Report"}</h3>
                      <p>{report.originalName}</p>
                      <p>Uploaded {formatDateTime(report.createdAt)}</p>
                      <p>{report.description || "No description provided for this report."}</p>
                    </div>

                    <div className="patient-report-actions">
                      <div className="patient-chip-row">
                        <span className="patient-chip">{formatFileSize(report.fileSize)}</span>
                        <span className="patient-chip">{report.mimeType || "Document"}</span>
                      </div>

                      <button className="btn btn-outline" type="button" onClick={() => downloadReport(report)}>
                        Download
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="patient-resource-side">
          <div className="panel patient-resource-summary-panel">
            <h3>Report Summary</h3>
            <div className="doctor-summary-list">
              <div className="doctor-summary-item">
                <span>Total Reports</span>
                <strong>{loading ? "..." : reports.length}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Latest Upload</span>
                <strong>{loading ? "Loading..." : latestUpload}</strong>
              </div>
              <div className="doctor-summary-item">
                <span>Total Storage</span>
                <strong>{loading ? "..." : formatFileSize(totalStorage)}</strong>
              </div>
            </div>
          </div>

          <div className="panel patient-resource-help-panel">
            <h3>Upload Tips</h3>
            <ul className="profile-tip-list">
              <li>Use clear titles so each document is easy to identify later.</li>
              <li>Upload recent reports before a consultation whenever possible.</li>
              <li>Add a short description if the file name alone is not enough context.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default PatientReports;

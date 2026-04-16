const toneByVariant = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  PAID: "paid",
  FAILED: "failed",
  VERIFIED: "verified",
  UNVERIFIED: "unverified"
};

function StatusBadge({ value, type = "status" }) {
  const normalizedValue = (value || "UNKNOWN").toString().toUpperCase();
  const tone = toneByVariant[normalizedValue] || "neutral";

  return (
    <span className={`status-badge status-badge--${tone} status-badge--${type}`}>
      {normalizedValue.replace(/_/g, " ")}
    </span>
  );
}

export default StatusBadge;

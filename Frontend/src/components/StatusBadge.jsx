const CLASS_BY_STATUS = {
  PENDING: "badge-pending",
  APPROVED: "badge-approved",
  ACCEPTED: "badge-approved",
  REJECTED: "badge-rejected",
  CANCELLED: "badge-cancelled",
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${CLASS_BY_STATUS[status] || "badge-pending"}`}>{status}</span>;
}

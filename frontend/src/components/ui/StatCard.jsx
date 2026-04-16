function StatCard({ label, value, hint, accent = "primary" }) {
  return (
    <article className={`metric-card metric-card--${accent}`}>
      <span className="metric-card__label">{label}</span>
      <strong className="metric-card__value">{value}</strong>
      {hint ? <p className="metric-card__hint">{hint}</p> : null}
    </article>
  );
}

export default StatCard;

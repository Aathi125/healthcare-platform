function EmptyState({ title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        <span>+</span>
      </div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

export default EmptyState;

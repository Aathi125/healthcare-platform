function Dialog({ open, title, description, children, actions, onClose }) {
  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog__header">
          <div>
            <h2 id="dialog-title">{title}</h2>
            {description ? <p id="dialog-description">{description}</p> : null}
          </div>
          <button
            type="button"
            className="dialog__close"
            aria-label="Close dialog"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="dialog__content">{children}</div>

        {actions ? <div className="dialog__actions">{actions}</div> : null}
      </div>
    </div>
  );
}

export default Dialog;

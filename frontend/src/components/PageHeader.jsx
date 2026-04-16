function PageHeader({ eyebrow = "Workspace", title, subtitle, action, meta }) {
  return (
    <div className="page-header">
      <div className="page-header__content">
        {eyebrow ? <span className="page-header__eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
        {meta ? <div className="page-header__meta">{meta}</div> : null}
      </div>
      {action && <div className="page-header__action">{action}</div>}
    </div>
  );
}

export default PageHeader;

function Loader({ label = "Loading...", fullPage = false }) {
  return (
    <div className={fullPage ? "loader-wrap full-page" : "loader-wrap"}>
      <div className="loader" aria-hidden="true" />
      <div className="loader-copy">
        <strong>Loading</strong>
        <p>{label}</p>
      </div>
    </div>
  );
}

export default Loader;

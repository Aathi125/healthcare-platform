export default function JitsiRoom({ url, onLeave }) {
  return (
    <section className="panel jitsi-shell">
      <div className="jitsi-head">
        <h3>Jitsi Meet</h3>
        <button className="btn btn-ghost" type="button" onClick={onLeave}>
          Close
        </button>
      </div>
      <p className="hint">
        Fallback when Twilio is not configured. Both participants should use the same session id and click Join so they
        land in the same room.
      </p>
      <iframe
        title="Jitsi Meet"
        className="jitsi-iframe"
        src={url}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
      />
    </section>
  );
}

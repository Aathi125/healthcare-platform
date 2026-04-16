import { useEffect, useRef, useState } from "react";

function ParticipantTile({ participant }) {
  const mediaRef = useRef(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const container = mediaRef.current;
    if (!container) {
      return undefined;
    }

    function clearTracks() {
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    }

    function attachPublication(publication) {
      if (!publication?.track) return;
      const element = publication.track.attach();
      element.classList.add("media-element");
      if (publication.track.kind === "video") {
        container.appendChild(element);
      } else if (publication.track.kind === "audio") {
        element.setAttribute("playsInline", "true");
        container.appendChild(element);
      }
    }

    function syncTracks() {
      clearTracks();
      let videoFound = false;
      const visit = (publication) => {
        attachPublication(publication);
        if (publication.track?.kind === "video") videoFound = true;
      };
      if (participant.videoTracks?.forEach) {
        participant.videoTracks.forEach(visit);
      }
      if (participant.audioTracks?.forEach) {
        participant.audioTracks.forEach(visit);
      }
      setHasVideo(videoFound);
    }

    function handleTrackSubscribed(track) {
      if (!track) return;
      const element = track.attach();
      element.classList.add("media-element");
      if (track.kind === "video") {
        container.appendChild(element);
        setHasVideo(true);
      } else if (track.kind === "audio") {
        element.setAttribute("playsInline", "true");
        container.appendChild(element);
      }
    }

    function handleTrackUnsubscribed(track) {
      track.detach().forEach((element) => element.remove());
      if (track.kind === "video") {
        const anyVideo =
          participant.videoTracks &&
          Array.from(participant.videoTracks.values()).some((p) => Boolean(p.track));
        setHasVideo(Boolean(anyVideo));
      }
    }

    syncTracks();
    participant.on("trackPublished", syncTracks);
    participant.on("trackSubscribed", handleTrackSubscribed);
    participant.on("trackUnsubscribed", handleTrackUnsubscribed);

    return () => {
      participant.removeListener("trackPublished", syncTracks);
      participant.removeListener("trackSubscribed", handleTrackSubscribed);
      participant.removeListener("trackUnsubscribed", handleTrackUnsubscribed);
      clearTracks();
    };
  }, [participant]);

  return (
    <div className="tile">
      <div className="tile-header">{participant.identity}</div>
      <div className="tile-body" ref={mediaRef}>
        {!hasVideo ? <div className="video-placeholder muted">No camera</div> : null}
      </div>
    </div>
  );
}

export default function VideoRoom({ room, onLeave }) {
  const participants = Array.from(room.participants.values());

  return (
    <section className="panel">
      <div className="jitsi-head">
        <h3 className="consult-panel-heading">Twilio Video</h3>
        <button className="btn btn-ghost" type="button" onClick={onLeave}>
          Leave
        </button>
      </div>
      <p className="hint" style={{ marginTop: 0 }}>
        <strong className="consult-accent">Room:</strong> {room.name}
      </p>
      <div className="grid">
        <ParticipantTile participant={room.localParticipant} />
        {participants.map((participant) => (
          <ParticipantTile key={participant.sid} participant={participant} />
        ))}
      </div>
    </section>
  );
}

import Knob from "./Knob";
import MeterCanvas from "./MeterCanvas";

// Faixa do mixer: medidor + ganho + pan + mute.
export default function MixerStrip({
  track,
  getAnalyser,
  subscribe,
  onGain, // imperativo
  onGainCommit,
  onPan,
  onPanCommit,
  onMute,
}) {
  return (
    <div className="sc-mixer-strip">
      <MeterCanvas getAnalyser={getAnalyser} subscribe={subscribe} />
      <div className="sc-strip-knobs">
        <Knob
          label="Vol"
          unit="dB"
          value={track.gainDb}
          min={-60}
          max={12}
          step={0.5}
          onChange={onGain}
          onCommit={onGainCommit}
        />
        <Knob
          label="Pan"
          value={track.pan}
          min={-1}
          max={1}
          step={0.05}
          onChange={onPan}
          onCommit={onPanCommit}
        />
      </div>
      <button
        type="button"
        className={`sc-mute-btn ${track.muted ? "sc-mute-on" : ""}`}
        onClick={() => onMute(!track.muted)}
        aria-pressed={track.muted}
        aria-label={track.muted ? "Reativar faixa" : "Silenciar faixa"}
        title={track.muted ? "Reativar" : "Silenciar"}
      >
        {track.muted ? "Mudo" : "M"}
      </button>
    </div>
  );
}

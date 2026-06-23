import { useEffect, useRef } from "react";

function fmt(t) {
  const s = Math.max(0, t || 0);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

// Barra de transporte: play/pause/stop, tempo corrente e ações de projeto.
export default function TransportBar({
  playing,
  onPlay,
  onPause,
  onStop,
  getTime,
  getDuration,
  subscribe,
  onAddTrackClick,
  onExport,
  exporting,
  canExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) {
  const timeRef = useRef(null);

  // Atualiza o relógio sem setState (texto direto no DOM).
  useEffect(() => {
    const draw = () => {
      if (timeRef.current) {
        timeRef.current.textContent = `${fmt(getTime?.())} / ${fmt(getDuration?.())}`;
      }
    };
    return subscribe(draw);
  }, [getTime, getDuration, subscribe]);

  return (
    <div className="sc-transport">
      <div className="sc-transport-left">
        {playing ? (
          <button type="button" className="sc-btn-primary sc-btn-sm" onClick={onPause}>
            ⏸ Pausar
          </button>
        ) : (
          <button type="button" className="sc-btn-primary sc-btn-sm" onClick={onPlay}>
            ▶ Tocar
          </button>
        )}
        <button type="button" className="sc-btn-ghost sc-btn-sm" onClick={onStop}>
          ⏹ Parar
        </button>
        <span className="sc-transport-time" ref={timeRef}>
          0:00 / 0:00
        </span>
      </div>

      <div className="sc-transport-right">
        <button
          type="button"
          className="sc-icon-btn"
          disabled={!canUndo}
          onClick={onUndo}
          title="Desfazer"
          aria-label="Desfazer"
        >
          ↶
        </button>
        <button
          type="button"
          className="sc-icon-btn"
          disabled={!canRedo}
          onClick={onRedo}
          title="Refazer"
          aria-label="Refazer"
        >
          ↷
        </button>
        <button type="button" className="sc-btn-ghost sc-btn-sm" onClick={onAddTrackClick}>
          + Faixa
        </button>
        <button
          type="button"
          className="sc-btn-primary sc-btn-sm"
          disabled={!canExport || exporting}
          onClick={onExport}
        >
          {exporting ? "Exportando…" : "Exportar mix"}
        </button>
      </div>
    </div>
  );
}

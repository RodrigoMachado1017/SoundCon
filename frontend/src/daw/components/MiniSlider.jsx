import { useRef, useState } from "react";

// Fader vertical estilo Reaper (cap metálico + trilho recessado) para EQs multibanda.
// Comportamento contínuo: clique/arraste posiciona o cap; estado local durante o
// arraste; onChange imperativo e onCommit no final (para undo). Acessível via slider.
export default function MiniSlider({ label, value, min, max, step = 1, onChange, onCommit }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const [active, setActive] = useState(false);
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (!active && value !== prevValue) {
    setPrevValue(value);
    setLocal(value);
  }

  const range = max - min;
  const frac = range === 0 ? 0 : (local - min) / range;

  function valueFromY(clientY) {
    const rect = trackRef.current.getBoundingClientRect();
    let f = 1 - (clientY - rect.top) / rect.height;
    f = Math.min(1, Math.max(0, f));
    let v = Math.round((min + f * range) / step) * step;
    v = Math.min(max, Math.max(min, v));
    return Number(v.toFixed(6));
  }

  function handleDown(e) {
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    dragging.current = true;
    setActive(true);
    const v = valueFromY(e.clientY);
    setLocal(v);
    onChange?.(v);
  }
  function handleMove(e) {
    if (!dragging.current) return;
    const v = valueFromY(e.clientY);
    setLocal(v);
    onChange?.(v);
  }
  function handleUp(e) {
    if (!dragging.current) return;
    e.target.releasePointerCapture?.(e.pointerId);
    dragging.current = false;
    setActive(false);
    onCommit?.(local);
  }
  function step1(dir) {
    const v = Math.min(max, Math.max(min, Number((local + dir * step).toFixed(6))));
    setLocal(v);
    onChange?.(v);
    onCommit?.(v);
  }

  const display = Number.isInteger(step) ? Math.round(local) : local.toFixed(1);

  return (
    <div className="sc-fader" title={`${label}: ${display}`}>
      <span className="sc-fader-value">{display}</span>
      <div
        className="sc-fader-track"
        ref={trackRef}
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={local}
        tabIndex={0}
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") step1(1);
          else if (e.key === "ArrowDown" || e.key === "ArrowLeft") step1(-1);
        }}
      >
        <span className="sc-fader-fill" style={{ height: `${frac * 100}%` }} />
        <span className="sc-fader-cap" style={{ bottom: `calc(${frac} * (100% - 14px))` }} />
      </div>
      <span className="sc-fader-label">{label}</span>
    </div>
  );
}

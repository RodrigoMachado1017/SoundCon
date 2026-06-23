import { useRef, useState } from "react";

// Potenciômetro rotativo (visual de dial metálico com notches, na paleta do projeto).
// Comportamento contínuo: arraste vertical altera o valor; só o knob re-renderiza
// durante o arraste (estado local) chamando onChange (imperativo no AudioParam).
// onCommit dispara no pointer-up (para undo). Acessível via role="slider" + setas.

const NOTCH_COUNT = 7;
// Ângulos fixos das marcas, distribuídos pelo arco de 270° (-135°..+135°, 0° = topo).
const NOTCHES = Array.from(
  { length: NOTCH_COUNT },
  (_, i) => -135 + (i / (NOTCH_COUNT - 1)) * 270
);

export default function Knob({ label, value, min, max, step = 1, unit = "", onChange, onCommit }) {
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [local, setLocal] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  // Sincroniza com o valor externo (sem efeito) quando não estamos arrastando.
  if (!dragging && value !== prevValue) {
    setPrevValue(value);
    setLocal(value);
  }

  const range = max - min;
  const frac = range === 0 ? 0 : (local - min) / range;
  const angle = -135 + frac * 270; // 0° = topo (12h)

  function clampStep(v) {
    let n = Math.round(v / step) * step;
    n = Math.min(max, Math.max(min, n));
    return Number(n.toFixed(6));
  }

  function handlePointerDown(e) {
    e.preventDefault();
    e.target.setPointerCapture?.(e.pointerId);
    drag.current = { startY: e.clientY, startValue: local };
    setDragging(true);
  }

  function handlePointerMove(e) {
    if (!drag.current) return;
    const dy = drag.current.startY - e.clientY;
    const next = clampStep(drag.current.startValue + (dy / 150) * range);
    setLocal(next);
    onChange?.(next);
  }

  function handlePointerUp(e) {
    if (!drag.current) return;
    e.target.releasePointerCapture?.(e.pointerId);
    const final = local;
    drag.current = null;
    setDragging(false);
    onCommit?.(final);
  }

  function step1(dir) {
    const next = clampStep(local + dir * step);
    setLocal(next);
    onChange?.(next);
    onCommit?.(next);
  }

  const display = Number.isInteger(step) ? Math.round(local) : local.toFixed(2);

  return (
    <div className="sc-knob">
      <div
        className="sc-knob-dial"
        role="slider"
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={local}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp" || e.key === "ArrowRight") step1(1);
          else if (e.key === "ArrowDown" || e.key === "ArrowLeft") step1(-1);
        }}
      >
        <div className="sc-knob-notches" aria-hidden="true">
          {NOTCHES.map((a, i) => (
            <span
              key={i}
              className="sc-knob-notch"
              style={{ transform: `translate(-50%, -50%) rotate(${a}deg) translateY(-23px)` }}
            />
          ))}
        </div>
        <span className="sc-knob-pointer" style={{ transform: `translate(-50%, -100%) rotate(${angle}deg)` }} />
      </div>
      <span className="sc-knob-label">{label}</span>
      <span className="sc-knob-value">
        {display}
        {unit}
      </span>
    </div>
  );
}

import { useMemo, useState } from "react";
import Knob from "./Knob";
import MiniSlider from "./MiniSlider";

const BADGE = {
  exact: { text: "live", cls: "sc-badge-live" },
  approx: { text: "live ≈", cls: "sc-badge-approx" },
  export: { text: "render", cls: "sc-badge-export" },
};

// Frequência compacta para a etiqueta do fader de banda (1000 -> "1k").
function freqLabel(hz) {
  if (hz == null) return "";
  if (hz >= 1000) {
    const k = hz / 1000;
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`;
  }
  return String(hz);
}

// Painel da cadeia de efeitos de uma faixa.
export default function FxChainPanel({
  fx, // [{ id, type, enabled, params, previewMode }]
  catalog, // [def]
  onAdd,
  onRemove,
  onToggle,
  onReorder,
  onParam, // (fxId, key, value) imperativo
  onParamCommit, // (fxId, key, value) -> estado
}) {
  const [pick, setPick] = useState("");
  const catalogByType = useMemo(() => new Map(catalog.map((d) => [d.type, d])), [catalog]);

  const groups = useMemo(() => {
    const g = {};
    for (const d of catalog) {
      (g[d.group] = g[d.group] || []).push(d);
    }
    return g;
  }, [catalog]);

  return (
    <div className="sc-fxchain">
      <div className="sc-fxchain-add">
        <select className="sc-input sc-input-sm" value={pick} onChange={(e) => setPick(e.target.value)}>
          <option value="">+ Adicionar efeito…</option>
          {Object.entries(groups).map(([group, defs]) => (
            <optgroup key={group} label={group}>
              {defs.map((d) => (
                <option key={d.type} value={d.type}>
                  {d.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          className="sc-btn-ghost sc-btn-sm"
          disabled={!pick}
          onClick={() => {
            if (pick) onAdd(pick);
            setPick("");
          }}
        >
          Add
        </button>
      </div>

      {fx.length === 0 && <p className="sc-placeholder sc-fx-empty">Sem efeitos nesta faixa.</p>}

      {fx.map((item, idx) => {
        const def = catalogByType.get(item.type);
        if (!def) return null;
        const badge = BADGE[item.previewMode] || BADGE.export;
        const isBand = Array.isArray(def.freqs) && def.freqs.length > 4;

        return (
          <div className={`sc-fx-item ${item.enabled ? "" : "sc-fx-off"}`} key={item.id}>
            <div className="sc-fx-head">
              <label className="sc-fx-toggle">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) => onToggle(item.id, e.target.checked)}
                />
                <strong>{def.label}</strong>
              </label>
              <span className={`sc-badge ${badge.cls}`}>{badge.text}</span>
              <div className="sc-fx-actions">
                <button
                  type="button"
                  className="sc-icon-btn"
                  disabled={idx === 0}
                  onClick={() => onReorder(idx, idx - 1)}
                  aria-label={`Mover ${def.label} para cima`}
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="sc-icon-btn"
                  disabled={idx === fx.length - 1}
                  onClick={() => onReorder(idx, idx + 1)}
                  aria-label={`Mover ${def.label} para baixo`}
                  title="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="sc-icon-btn sc-icon-danger"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Remover ${def.label}`}
                  title="Remover efeito"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={isBand ? "sc-fx-bands" : "sc-fx-knobs"}>
              {def.params.map((spec, bandIdx) =>
                isBand ? (
                  <MiniSlider
                    key={spec.key}
                    label={def.freqs ? freqLabel(def.freqs[bandIdx]) : spec.label.replace(/^Banda\s*/, "")}
                    value={item.params[spec.key]}
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    onChange={(v) => onParam(item.id, spec.key, v)}
                    onCommit={(v) => onParamCommit(item.id, spec.key, v)}
                  />
                ) : (
                  <Knob
                    key={spec.key}
                    label={spec.label}
                    unit={spec.unit}
                    value={item.params[spec.key]}
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    onChange={(v) => onParam(item.id, spec.key, v)}
                    onCommit={(v) => onParamCommit(item.id, spec.key, v)}
                  />
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

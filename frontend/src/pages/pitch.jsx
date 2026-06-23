import { useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { convertAudio, fileUrl } from "../services/api";
import { SAMPLE_RATES, BITRATES, BIT_DEPTHS, isLossy, hasBitDepth } from "../services/audioQuality";

function qualityInfo(cents) {
  const abs = Math.abs(cents);
  if (abs <= 300) return { level: "safe", text: "Faixa segura" };
  if (abs <= 600) return { level: "caution", text: "Atenção: pode degradar" };
  return { level: "high_risk", text: "Risco alto de artefatos" };
}

export default function Pitch() {
  const [file, setFile] = useState(null);
  const [pitchCents, setPitchCents] = useState(0);
  const [format, setFormat] = useState("mp3");
  const [sampleRate, setSampleRate] = useState(44100);
  const [bitrate, setBitrate] = useState(192);
  const [bitDepth, setBitDepth] = useState(16);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("neutral");
  const [resultUrl, setResultUrl] = useState(null);
  const [resultName, setResultName] = useState("");

  const quality = useMemo(() => qualityInfo(pitchCents), [pitchCents]);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setMessage("Selecione um arquivo para aplicar pitch.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setResultUrl(null);

    try {
      const { ok, data } = await convertAudio({
        file,
        format,
        pitchCents,
        sampleRate,
        bitrate: isLossy(format) ? bitrate : undefined,
        bitDepth: hasBitDepth(format) ? bitDepth : undefined,
      });

      if (!ok) {
        setMessage(data.error || "Erro ao processar mudança de pitch.");
        setMessageType("error");
      } else {
        setResultUrl(fileUrl(data.url));
        setResultName(data.url.split("/").pop());
        setMessage(data.quality?.warning || "Pitch aplicado com sucesso.");
        setMessageType(data.quality?.level === "safe" ? "success" : "warning");
      }
    } catch {
      setMessage("Erro de conexão com o servidor.");
      setMessageType("error");
    }

    setLoading(false);
  }

  return (
    <AppLayout
      title="Pitch"
      subtitle="Ajuste tonalidade em cents com feedback de qualidade"
    >
      <section className="sc-panels-grid sc-panels-grid-eq">
        <article className="sc-panel">
          <div className="sc-panel-head">
            <h2>Mudança de tonalidade</h2>
            <span>Faixa permitida: -900 a 900 cents</span>
          </div>

          <form onSubmit={handleSubmit} className="sc-convert-form-new">
            <label className="sc-upload-zone">
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div>
                <strong>{file ? file.name : "Arraste ou selecione seu arquivo"}</strong>
                <p>Ajuste tonal sem alterar fluxo de download</p>
              </div>
            </label>

            <div className="sc-row-2">
              <div>
                <label className="sc-field-label">Pitch (cents)</label>
                <input
                  className="sc-input"
                  type="number"
                  min={-900}
                  max={900}
                  step={1}
                  value={pitchCents}
                  onChange={(e) => setPitchCents(Number(e.target.value || 0))}
                />
              </div>

              <div>
                <label className="sc-field-label">Formato de saída</label>
                <select className="sc-input" value={format} onChange={(e) => setFormat(e.target.value)}>
                  <option value="mp3">MP3</option>
                  <option value="wav">WAV</option>
                  <option value="ogg">OGG</option>
                  <option value="aac">AAC</option>
                  <option value="flac">FLAC</option>
                  <option value="m4a">M4A</option>
                  <option value="opus">OPUS</option>
                </select>
              </div>
            </div>

            <div className="sc-row-2">
              <div>
                <label className="sc-field-label">Sample rate</label>
                <select className="sc-input" value={sampleRate} onChange={(e) => setSampleRate(Number(e.target.value))}>
                  {SAMPLE_RATES.map((sr) => (
                    <option key={sr} value={sr}>
                      {sr} Hz
                    </option>
                  ))}
                </select>
              </div>

              {isLossy(format) && (
                <div>
                  <label className="sc-field-label">Bitrate</label>
                  <select className="sc-input" value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))}>
                    {BITRATES.map((b) => (
                      <option key={b} value={b}>
                        {b} kbps
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {hasBitDepth(format) && (
                <div>
                  <label className="sc-field-label">Profundidade</label>
                  <select className="sc-input" value={bitDepth} onChange={(e) => setBitDepth(Number(e.target.value))}>
                    {BIT_DEPTHS.map((d) => (
                      <option key={d} value={d}>
                        {d}-bit
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button className="sc-btn-primary" type="submit" disabled={loading}>
              {loading ? "Processando..." : "Aplicar pitch"}
            </button>
          </form>

          {message && <p className={`sc-feedback sc-feedback-${messageType}`}>{message}</p>}
        </article>

        <article className="sc-panel">
          <div className="sc-panel-head">
            <h2>Orientação de qualidade</h2>
            <span>{quality.text}</span>
          </div>

          <div className="sc-quality-box sc-quality-box-no-border">
            <p className="sc-placeholder"><strong>safe:</strong> até 300 cents</p>
            <p className="sc-placeholder"><strong>caution:</strong> 301 a 600 cents</p>
            <p className="sc-placeholder"><strong>high_risk:</strong> 601 a 900 cents</p>
          </div>

          {resultUrl ? (
            <div className="sc-result-box">
              <audio controls src={resultUrl} />
              <a href={resultUrl} download={resultName} className="sc-btn-primary sc-inline-btn">
                Baixar arquivo com pitch
              </a>
            </div>
          ) : (
            <p className="sc-placeholder">Após processar, o arquivo aparecerá aqui para preview.</p>
          )}
        </article>
      </section>
    </AppLayout>
  );
}

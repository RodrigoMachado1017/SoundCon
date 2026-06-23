import { useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import { convertAudio, fileUrl } from "../services/api";
import { SAMPLE_RATES, BITRATES, BIT_DEPTHS, isLossy, hasBitDepth } from "../services/audioQuality";

const formatOptions = ["mp3", "wav", "ogg", "aac", "flac", "m4a", "opus"];

export default function Convert() {
  const [file, setFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [sampleRate, setSampleRate] = useState(44100);
  const [bitrate, setBitrate] = useState(192);
  const [bitDepth, setBitDepth] = useState(16);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("neutral");
  const [convertedUrl, setConvertedUrl] = useState(null);
  const [convertedFileName, setConvertedFileName] = useState("");

  const cards = useMemo(
    () => [
      { title: "Arquivo selecionado", value: file ? "1" : "0", sub: file ? file.name : "nenhum" },
      { title: "Formato de saída", value: outputFormat.toUpperCase(), sub: "conversão" },
      { title: "Status", value: loading ? "Processando" : "Pronto", sub: "pipeline" },
    ],
    [file, outputFormat, loading]
  );

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setMessage("Selecione um arquivo de áudio antes de converter.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    setConvertedUrl(null);

    try {
      const { ok, data } = await convertAudio({
        file,
        format: outputFormat,
        pitchCents: 0,
        sampleRate,
        bitrate: isLossy(outputFormat) ? bitrate : undefined,
        bitDepth: hasBitDepth(outputFormat) ? bitDepth : undefined,
      });

      if (!ok) {
        setMessage(data.error || "Erro ao converter arquivo.");
        setMessageType("error");
        setLoading(false);
        return;
      }

      setConvertedUrl(fileUrl(data.url));
      setConvertedFileName(data.url.split("/").pop());
      setMessage("Arquivo convertido com sucesso.");
      setMessageType("success");
    } catch {
      setMessage("Erro de conexão com o servidor.");
      setMessageType("error");
    }

    setLoading(false);
  }

  return (
    <AppLayout
      title="Conversão"
      subtitle="Converta entre formatos mantendo o áudio original"
    >
      <section className="sc-kpi-grid sc-kpi-grid-3">
        {cards.map((card) => (
          <article className="sc-kpi-card" key={card.title}>
            <p>{card.title}</p>
            <strong>{card.value}</strong>
            <span>{card.sub}</span>
          </article>
        ))}
      </section>

      <section className="sc-panels-grid sc-panels-grid-eq">
        <article className="sc-panel">
          <div className="sc-panel-head">
            <h2>Converter arquivo</h2>
            <span>Formato de saída</span>
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
                <p>Suporte para arquivos de áudio aceitos pelo navegador</p>
              </div>
            </label>

            <div className="sc-row-2">
              <div>
                <label className="sc-field-label">Formato de saída</label>
                <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="sc-input">
                  {formatOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

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
            </div>

            {isLossy(outputFormat) && (
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

            {hasBitDepth(outputFormat) && (
              <div>
                <label className="sc-field-label">Profundidade (bit depth)</label>
                <select className="sc-input" value={bitDepth} onChange={(e) => setBitDepth(Number(e.target.value))}>
                  {BIT_DEPTHS.map((d) => (
                    <option key={d} value={d}>
                      {d}-bit
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button className="sc-btn-primary" type="submit" disabled={loading}>
              {loading ? "Processando..." : "Converter agora"}
            </button>
          </form>

          {message && <p className={`sc-feedback sc-feedback-${messageType}`}>{message}</p>}
        </article>

        <article className="sc-panel">
          <div className="sc-panel-head">
            <h2>Resultado</h2>
            <span>Preview e download</span>
          </div>

          {convertedUrl ? (
            <div className="sc-result-box">
              <audio controls src={convertedUrl} />
              <a href={convertedUrl} download={convertedFileName} className="sc-btn-primary sc-inline-btn">
                Baixar arquivo
              </a>
            </div>
          ) : (
            <p className="sc-placeholder">Converta um arquivo para liberar o preview de áudio.</p>
          )}
        </article>
      </section>
    </AppLayout>
  );
}

import { useState } from "react";
import "./convert.css";

export default function Convert() {
  const [file, setFile] = useState(null);
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!file) {
      setMessage("Selecione um arquivo primeiro.");
      return;
    }

    setLoading(true);
    setMessage("");

    const form = new FormData();
    form.append("file", file);
    form.append("format", outputFormat);

    try {
      const resp = await fetch("http://localhost:3001/audio/convert", {
        method: "POST",
        body: form,
      });

      const data = await resp.json();

      if (!resp.ok) {
        setMessage(data.error || "Erro ao converter.");
        setLoading(false);
        return;
      }

      const downloadUrl = `http://localhost:3001${data.url}`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = data.url.split("/").pop();
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage("Arquivo convertido e baixado com sucesso!");

    } catch (err) {
      setMessage("Erro ao enviar o arquivo.");
      console.error(err);
    }

    setLoading(false);
  }

  return (
    <div className="sc-convert-wrapper">
      <div className="sc-convert-card">
        <h2>Conversor de Áudio Universal</h2>
        <p className="sc-sub">Converta qualquer formato usando FFmpeg.</p>

        <form onSubmit={handleSubmit} className="sc-convert-form">
          <label className="sc-drop">
            {file ? file.name : "Arraste ou selecione seu arquivo"}
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <div className="sc-options">
            <label>
              Formato de saída:
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
              >
                <option value="mp3">MP3</option>
                <option value="wav">WAV</option>
                <option value="ogg">OGG</option>
                <option value="aac">AAC</option>
                <option value="flac">FLAC</option>
                <option value="m4a">M4A</option>
                <option value="opus">OPUS</option>
              </select>
            </label>

            <button className="sc-btn" type="submit" disabled={loading}>
              {loading ? "Convertendo..." : "Converter"}
            </button>
          </div>
        </form>

        {message && <div className="sc-message">{message}</div>}
      </div>
    </div>
  );
}

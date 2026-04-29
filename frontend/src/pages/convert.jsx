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
    <div className="home-container">
      <div className="glass-card text-center" style={{ width: '500px' }}>
        <h2 className="hero-title highlight" style={{ fontSize: '2.5rem' }}>Conversor Universal</h2>
        <p className="hero-subtitle" style={{ marginBottom: '2rem' }}>Converta qualquer formato de áudio facilmente</p>

        <form onSubmit={handleSubmit} className="form-container">
          <label className="input-primary" style={{ cursor: 'pointer', borderStyle: 'dashed', padding: '2rem 1rem' }}>
            {file ? file.name : "Arraste ou clique para selecionar seu arquivo"}
            <input
              type="file"
              accept="audio/*"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files[0])}
            />
          </label>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center' }}>
            <label style={{ color: 'var(--text-secondary)' }}>Formato de saída:</label>
            <select
              className="input-primary"
              style={{ width: 'auto', marginBottom: 0, padding: '0.8rem' }}
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
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '2rem' }}>
            {loading ? "Processando..." : "Converter Agora"}
          </button>
        </form>

        {message && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            borderRadius: '8px', 
            background: message.includes('Erro') ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)',
            color: 'white'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

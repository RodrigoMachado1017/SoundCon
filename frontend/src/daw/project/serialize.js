// Serializa o estado da DAW no payload aceito por POST /audio/mix.
// Faixas mudas são excluídas do render; o fileIndex acompanha a ordem dos arquivos enviados.
export function serializeProject(project) {
  const active = project.tracks.filter((t) => !t.muted && t.file);

  const files = active.map((t) => t.file);
  const payload = {
    tracks: active.map((t, i) => ({
      fileIndex: i,
      gainDb: t.gainDb,
      pan: t.pan,
      fx: t.fx.map((f) => ({ type: f.type, enabled: f.enabled, params: f.params })),
    })),
    master: { gainDb: project.master.gainDb, limiter: project.master.limiter },
  };

  return { files, payload };
}

export default function Home() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bem-vinda ao SoundCON 🎧</h1>
      <p style={styles.subtitle}>
        Aqui você poderá converter e processar seus áudios de forma rápida!
      </p>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
  },
  title: {
    fontSize: "2.8rem",
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: "1.2rem",
    marginTop: "15px",
    color: "#555",
  },
};

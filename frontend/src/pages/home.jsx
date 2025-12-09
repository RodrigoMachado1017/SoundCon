import { useNavigate } from "react-router-dom";
export default function Home() {
    const nav = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bem-vinda ao SoundCON 🎧</h1>
      <p style={styles.subtitle}>
        Aqui você poderá converter e processar seus áudios de forma rápida!
        aperte <a>aqui</a> para seguir para o login.
      </p>
      <div style={styles.buttons}>  
        <button onClick={() => nav("./login")} style={styles.btn1}  >
          Login
        </button>
        <button onClick={() => nav("./cadastro")} style={styles.btn2}>
          Cadastro
        </button>
      </div>
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
  },
  title: {
    fontSize: "2.8rem",
    fontWeight: "bold",
    color: "#e0e0e0"
  },
  subtitle: {
    fontSize: "1.2rem",
    marginTop: "15px",
    color: "#e0e0e0",
  },
  buttons: {
    display: "flex",
    flexDirection: "collum",
    gap: "10px",
  },
    btn1: {
      width: "fit-content",
      padding: "0.9rem",
      border: "none",
      borderRadius: "8px",
      color: "#2b124a",
      fontWeight: 700,
      cursor: "pointer",
    },
    btn2: {
      width: "fit-content",
      padding: "0.9rem",
      border: "none",
      borderRadius: "8px",
      color: "#2b124a",
      fontWeight: 700,
      cursor: "pointer",
    },
};

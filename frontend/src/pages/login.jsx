import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login() {
  const nav = useNavigate();
  
  async function handleSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const email = form[0].value;
    const senha = form[1].value;

    await fetch("http://localhost:3001/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        senha
      })
    })
    .then(resp => {
      if(resp.status === 200){
        nav("/convert")
      }
    });
  }

  return (
    <div className="home-container">
      <div className="glass-card text-center" style={{ width: '400px' }}>
        <h2 className="hero-title highlight" style={{ fontSize: '2.5rem' }}>SoundCON</h2>
        <p className="hero-subtitle" style={{ marginBottom: '1rem' }}>Acesse para converter seus áudios</p>

        <form onSubmit={handleSubmit} className="form-container">
          <input className="input-primary" placeholder="Email" type="email" required />
          <input className="input-primary" placeholder="Senha" type="password" required />
          <button className="btn-primary" type="submit" style={{ marginTop: '1rem' }}>Entrar</button>
        </form>

        <p className="hero-subtitle" style={{ fontSize: '0.9rem', marginTop: '2rem', marginBottom: '1rem' }}>Ou vá direto para a ferramenta</p>
        <button className="btn-secondary" onClick={() => nav("/convert")} style={{ width: '100%' }}>Ir para Conversão</button>
      </div>
    </div>
  );
}

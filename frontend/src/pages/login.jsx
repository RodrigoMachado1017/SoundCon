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
    <div className="sc-login-wrapper">
      <div className="sc-login-card">
        <h1>SoundCON</h1>
        <p className="sc-sub">Converter de áudio rápido</p>

        <form onSubmit={handleSubmit} className="sc-login-form">
          <input placeholder="Email" type="email" required />
          <input placeholder="Senha" type="password" required />
          <button className="sc-btn" type="submit">Entrar</button>
        </form>

        <p className="sc-note">Ou vá direto para a ferramenta de conversão</p>
        <button className="sc-ghost" onClick={() => nav("/convert")}>Ir para Conversão</button>
      </div>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import "./cadastro.css";

export default function Login() {
  const nav = useNavigate();

async function handleSubmit(e) { 
  e.preventDefault();

  const form = e.target;
  const nome = form[0].value;
  const email = form[1].value;
  const senha = form[2].value;

  await fetch("http://localhost:3001/cadastro", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome,
      email,
      senha
    })
  })
  .then(resp => {
    console.log(resp);
    nav("/login")
  });
}

  return (
    <div className="sc-login-wrapper">
      <div className="sc-login-card">
        <h1>Cadastro</h1>
        <p className="sc-sub">Converter de áudio rápido</p>

        <form onSubmit={handleSubmit} className="sc-login-form">
          <input placeholder="Nome" type="string" required />
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

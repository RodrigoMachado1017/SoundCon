import { useNavigate } from "react-router-dom";
import "./cadastro.css";

export default function Cadastro() {
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
    <div className="home-container">
      <div className="glass-card text-center" style={{ width: '400px' }}>
        <h2 className="hero-title highlight" style={{ fontSize: '2.5rem' }}>Cadastro</h2>
        <p className="hero-subtitle" style={{ marginBottom: '1rem' }}>Crie sua conta para converter áudios</p>

        <form onSubmit={handleSubmit} className="form-container">
          <input className="input-primary" placeholder="Nome" type="text" required />
          <input className="input-primary" placeholder="Email" type="email" required />
          <input className="input-primary" placeholder="Senha" type="password" required />
          <button className="btn-primary" type="submit" style={{ marginTop: '1rem' }}>Criar Conta</button>
        </form>

        <p className="hero-subtitle" style={{ fontSize: '0.9rem', marginTop: '2rem', marginBottom: '1rem' }}>Já tem conta?</p>
        <button className="btn-secondary" onClick={() => nav("/login")} style={{ width: '100%' }}>Fazer Login</button>
      </div>
    </div>
  );
}

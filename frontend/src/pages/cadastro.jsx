import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import favicon from "../assets/soundcon-favcon.png";
import "./dashboard.css";

export default function Cadastro() {
  const nav = useNavigate();
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");

    const form = e.target;
    const nome = form.elements.nome.value;
    const email = form.elements.email.value;
    const senha = form.elements.senha.value;
    const confirmar = form.elements.confirmar.value;

    if (senha !== confirmar) {
      setError("A confirmação de senha não confere.");
      return;
    }

    setLoading(true);
    try {
      await signUp({ nome, email, senha });
      // Dependendo da config do Supabase, pode exigir confirmação por e-mail.
      setInfo("Conta criada! Se a confirmação por e-mail estiver ativa, verifique sua caixa de entrada.");
      setTimeout(() => nav("/login"), 1200);
    } catch (err) {
      setError(err?.message || "Não foi possível realizar o cadastro.");
    }
    setLoading(false);
  }

  return (
    <div className="sc-auth-screen">
      <div className="sc-auth-card">
        <div className="sc-brand">
          <img className="sc-brand-img" src={favicon} alt="" />
          <span>SoundCon</span>
        </div>

        <h2 className="sc-auth-title">Cadastro</h2>
        <p className="sc-auth-subtitle">Crie sua conta para usar a plataforma SoundCon.</p>

        <div className="sc-progress-wrap">
          <div className="sc-progress-bar" />
        </div>

        <form onSubmit={handleSubmit} className="sc-auth-form">
          <label htmlFor="cad-nome">Nome</label>
          <input id="cad-nome" name="nome" className="sc-input" placeholder="Seu nome" type="text" autoComplete="name" required />

          <label htmlFor="cad-email">Email</label>
          <input id="cad-email" name="email" className="sc-input" placeholder="seu@email.com" type="email" autoComplete="email" required />

          <label htmlFor="cad-senha">Senha</label>
          <div className="sc-input-wrap">
            <input
              id="cad-senha"
              name="senha"
              className="sc-input sc-input-with-btn"
              placeholder="••••••••"
              type={showSenha ? "text" : "password"}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="sc-input-toggle"
              onClick={() => setShowSenha((v) => !v)}
            >
              {showSenha ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <label htmlFor="cad-confirmar">Confirmar senha</label>
          <div className="sc-input-wrap">
            <input
              id="cad-confirmar"
              name="confirmar"
              className="sc-input sc-input-with-btn"
              placeholder="••••••••"
              type={showConfirmar ? "text" : "password"}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              className="sc-input-toggle"
              onClick={() => setShowConfirmar((v) => !v)}
            >
              {showConfirmar ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <button className="sc-btn-primary" type="submit" disabled={loading}>
            {loading ? "Criando conta..." : "Finalizar cadastro"}
          </button>
        </form>

        {error && <p className="sc-error">{error}</p>}
        {info && <p className="sc-feedback sc-feedback-success">{info}</p>}

        <div className="sc-auth-foot">
          <button className="sc-btn-link" onClick={() => nav("/login")}>
            Já tenho conta
          </button>
        </div>
      </div>
    </div>
  );
}

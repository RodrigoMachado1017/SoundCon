import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import favicon from "../assets/soundcon-favcon.png";
import "./dashboard.css";

export default function Login() {
  const nav = useNavigate();
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSenha, setShowSenha] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const form = e.target;
    const email = form.elements.email.value;
    const senha = form.elements.senha.value;

    setLoading(true);
    try {
      await signIn({ email, senha });
      nav("/");
    } catch (err) {
      setError(err?.message || "Credenciais inválidas.");
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

        <h2 className="sc-auth-title">Acesso</h2>
        <p className="sc-auth-subtitle">Entre para converter áudio e ajustar tonalidade.</p>

        <div className="sc-progress-wrap">
          <div className="sc-progress-bar" />
        </div>

        <form onSubmit={handleSubmit} className="sc-auth-form">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            name="email"
            className="sc-input"
            placeholder="seu@email.com"
            type="email"
            autoComplete="email"
            required
          />

          <label htmlFor="login-senha">Senha</label>
          <div className="sc-input-wrap">
            <input
              id="login-senha"
              name="senha"
              className="sc-input sc-input-with-btn"
              placeholder="••••••••"
              type={showSenha ? "text" : "password"}
              autoComplete="current-password"
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

          <button className="sc-btn-primary" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Continuar"}
          </button>
        </form>

        {error && <p className="sc-error">{error}</p>}

        <div className="sc-auth-foot">
          <button className="sc-btn-ghost" onClick={() => nav("/cadastro")}>
            Criar conta
          </button>
        </div>
      </div>
    </div>
  );
}

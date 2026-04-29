import { useNavigate } from "react-router-dom";
import "./home.css"; 
import logo from "../assets/favcon.png";

export default function Home() {
  const nav = useNavigate();

  return (
    <div className="home-container">
      <div className="glass-card text-center">
        <h1 className="hero-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <span>Bem-vindo ao <span className="highlight">SoundCON</span></span>
          <img src={logo} alt="SoundCON Logo" style={{ height: '3.5rem', filter: 'drop-shadow(0 0 10px rgba(155, 81, 224, 0.3))' }} />
        </h1>
        <p className="hero-subtitle">
          Aqui você pode converter e processar seus áudios de forma rápida e elegante!
        </p>
        
        <div className="button-group">
          <button className="btn-primary" onClick={() => nav("./login")}>
            Entrar
          </button>
          <button className="btn-secondary" onClick={() => nav("./cadastro")}>
            Cadastrar
          </button>
        </div>
      </div>
    </div>
  );
}

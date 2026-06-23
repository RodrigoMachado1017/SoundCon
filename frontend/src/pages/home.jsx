import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const nav = useNavigate();
  const { displayName } = useAuth();
  const userName = displayName;

  return (
    <AppLayout
      title="Welcome"
      subtitle="Área principal do SoundCon para conversão e mudança de pitch"
    >
      <section className="sc-welcome-card">
        <h2>Bem-vindo de volta, {userName}!</h2>
        <p>
          Seu ambiente está pronto. Escolha abaixo a função que deseja usar agora.
        </p>
        <div className="sc-welcome-actions">
          <button className="sc-btn-primary" onClick={() => nav("/convert")}>Ir para Conversão</button>
          <button className="sc-btn-ghost" onClick={() => nav("/pitch")}>Ir para Pitch</button>
        </div>
      </section>
    </AppLayout>
  );
}

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

// Bloqueia o acesso a rotas privadas quando não há sessão.
// Sem Supabase configurado (dev), deixa passar para não travar o ambiente.
export default function ProtectedRoute({ children }) {
  const { isLogged, loading, configured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="sc-auth-screen">
        <div className="sc-auth-card">Carregando sessão…</div>
      </div>
    );
  }

  if (!configured) return children;

  if (!isLogged) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

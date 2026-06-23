import { Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Cadastro from "./pages/cadastro";
import Home from "./pages/home";
import Convert from "./pages/convert";
import Pitch from "./pages/pitch";
import Daw from "./pages/daw";
import UserPage from "./pages/user";
import ProtectedRoute from "./auth/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Rotas protegidas */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/convert"
        element={
          <ProtectedRoute>
            <Convert />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pitch"
        element={
          <ProtectedRoute>
            <Pitch />
          </ProtectedRoute>
        }
      />
      <Route
        path="/daw"
        element={
          <ProtectedRoute>
            <Daw />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user"
        element={
          <ProtectedRoute>
            <UserPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

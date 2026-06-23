import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../auth/AuthProvider";
import { getProfile, updateProfile } from "../services/api";
import { supabase, isSupabaseConfigured } from "../services/supabase";

export default function UserPage() {
  const { user, displayName } = useAuth();
  const [nome, setNome] = useState(displayName || "");
  const email = user?.email || "";
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("neutral");
  const [saving, setSaving] = useState(false);

  // Carrega o perfil do backend (/me) quando configurado.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    getProfile().then(({ ok, data }) => {
      if (active && ok && data?.profile?.nome) setNome(data.profile.nome);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");

    if (!nome.trim()) {
      setMessage("Informe um nome válido.");
      setMessageType("error");
      return;
    }

    if (novaSenha && novaSenha !== confirmarSenha) {
      setMessage("A confirmação de senha não confere.");
      setMessageType("error");
      return;
    }

    if (!isSupabaseConfigured) {
      setMessage("Supabase não configurado. Configure o .env para salvar o perfil.");
      setMessageType("warning");
      return;
    }

    setSaving(true);
    try {
      const { ok, data } = await updateProfile({ nome: nome.trim() });
      if (!ok) throw new Error(data?.error || "Falha ao atualizar perfil.");

      // Mantém o user_metadata.nome em sincronia para o displayName.
      await supabase.auth.updateUser({ data: { nome: nome.trim() } });

      if (novaSenha) {
        const { error } = await supabase.auth.updateUser({ password: novaSenha });
        if (error) throw error;
        setNovaSenha("");
        setConfirmarSenha("");
      }

      setMessage("Dados atualizados com sucesso.");
      setMessageType("success");
    } catch (err) {
      setMessage(err?.message || "Erro ao salvar alterações.");
      setMessageType("error");
    }
    setSaving(false);
  }

  return (
    <AppLayout title="Usuário" subtitle="Atualize seus dados pessoais de acesso">
      <section className="sc-panel sc-user-panel">
        <div className="sc-panel-head">
          <h2>Perfil do usuário</h2>
          <span>Edição de dados</span>
        </div>

        <form onSubmit={handleSave} className="sc-convert-form-new">
          <div className="sc-row-2">
            <div>
              <label className="sc-field-label">Nome</label>
              <input className="sc-input" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div>
              <label className="sc-field-label">Email</label>
              <input className="sc-input" type="email" value={email} readOnly disabled />
            </div>
          </div>

          <div className="sc-row-2">
            <div>
              <label className="sc-field-label">Nova senha (opcional)</label>
              <input
                className="sc-input"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Deixe vazio para manter"
              />
            </div>
            <div>
              <label className="sc-field-label">Confirmar nova senha</label>
              <input
                className="sc-input"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          <button className="sc-btn-primary" type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>

        {message && <p className={`sc-feedback sc-feedback-${messageType}`}>{message}</p>}
      </section>
    </AppLayout>
  );
}

import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import favicon from "../assets/soundcon-favcon.png";

const navItems = [
  { to: "/", label: "Welcome" },
  { to: "/convert", label: "Conversão" },
  { to: "/pitch", label: "Pitch" },
  { to: "/daw", label: "Mixer" },
  { to: "/user", label: "Usuário" },
];

export default function AppLayout({ title, subtitle, children }) {
  const nav = useNavigate();
  const { signOut, displayName } = useAuth();

  async function handleLogout() {
    await signOut();
    nav("/login");
  }

  return (
    <div className="sc-shell-page">
      <aside className="sc-sidebar">
        <div className="sc-brand sc-brand-side">
          <img className="sc-brand-img" src={favicon} alt="" />
          <span>SoundCon</span>
        </div>

        <p className="sc-menu-title">Menu</p>

        <nav className="sc-nav-list">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sc-nav-item ${isActive ? "sc-nav-active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sc-sidebar-footer">
          <button className="sc-nav-item" type="button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="sc-main">
        <header className="sc-topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="sc-status-pill">
            <span className="dot" />
            {displayName}
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}

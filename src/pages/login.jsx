import "./login.css";

function Login() {
  return (
    <div className="container">
      <div className="login-box">
        <h2>Login</h2>
        <form>
          <div className="input-group">
            <label>Email</label>
            <input type="email" />
          </div>

          <div className="input-group">
            <label>Senha</label>
            <input type="password" />
          </div>

          <button className="login-btn" type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;

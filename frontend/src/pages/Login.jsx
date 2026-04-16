import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { roleHomePath, useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated } = useAuth();
  const redirectTarget = location.state?.from;

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(redirectTarget || roleHomePath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate, redirectTarget]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loggedInUser = await login(form);
      const targetPath = redirectTarget || roleHomePath(loggedInUser.role);
      navigate(targetPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section auth-shell">
      <div className="container">
        <div className="auth-shell__layout auth-shell__layout--single">
          <div className="form-card auth-card auth-card--premium">
            <h2>Sign In</h2>
            <p>Use your account credentials to continue.</p>

            <form onSubmit={handleSubmit} className="form-grid">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                />
              </label>

              {error && <p className="form-error">{error}</p>}

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <p className="auth-helper">
              New patient? <Link to="/register-patient">Create patient account</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;

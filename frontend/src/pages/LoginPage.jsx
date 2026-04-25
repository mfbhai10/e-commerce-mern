import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import AuthShell from "../components/auth/AuthShell";

const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("token");

    if (!token) {
      setCheckingSession(false);
      return;
    }

    const checkSession = async () => {
      try {
        const response = await authService.getMe();
        const role = response.data.data.user.role;
        navigate(role === "admin" ? "/admin" : "/", { replace: true });
      } catch (_error) {
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await authService.login(form);
      window.localStorage.setItem("token", response.data.data.token);
      navigate(response.data.data.user.role === "admin" ? "/admin" : "/", {
        replace: true,
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <section className="page">
        <div className="status-card">Checking session...</div>
      </section>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to access your cart, checkout, and saved account actions."
      footer={
        <p>
          New here? <Link to="/register">Create an account</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error ? (
          <div className="status-card status-card--error">{error}</div>
        ) : null}
        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            required
          />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required
          />
        </label>
        <button type="submit" className="button-link" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
};

export default LoginPage;

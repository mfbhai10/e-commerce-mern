import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import AuthShell from "../components/auth/AuthShell";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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

      const response = await authService.register(form);
      window.localStorage.setItem("token", response.data.data.token);
      navigate(response.data.data.user.role === "admin" ? "/admin" : "/", {
        replace: true,
      });
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || "Unable to create account.",
      );
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
      title="Create your account"
      description="Register once and reuse the same session for browsing, cart, and checkout."
      footer={
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Register</h2>
        {error ? (
          <div className="status-card status-card--error">{error}</div>
        ) : null}
        <label className="form-field">
          <span>Name</span>
          <input
            type="text"
            value={form.name}
            onChange={handleChange("name")}
            required
          />
        </label>
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
            minLength="8"
          />
        </label>
        <button type="submit" className="button-link" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
};

export default RegisterPage;

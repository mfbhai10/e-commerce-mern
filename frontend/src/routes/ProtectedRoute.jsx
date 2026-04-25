import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import authService from "../services/authService";
import { hasToken } from "../utils/authStorage";

const ProtectedRoute = () => {
  const location = useLocation();
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const verifySession = async () => {
      if (!hasToken()) {
        setStatus("denied");
        return;
      }

      try {
        await authService.getMe();
        setStatus("allowed");
      } catch (_error) {
        setStatus("denied");
      }
    };

    verifySession();
  }, [location.pathname]);

  if (status === "checking") {
    return (
      <section className="page">
        <div className="status-card">Checking session...</div>
      </section>
    );
  }

  if (status === "denied") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

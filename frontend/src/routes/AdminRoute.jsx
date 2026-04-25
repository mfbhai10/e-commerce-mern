import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../services/authService';

const AdminRoute = () => {
  const location = useLocation();
  const [status, setStatus] = useState('checking');
  const [redirectTo, setRedirectTo] = useState('/login');

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = window.localStorage.getItem('token');

      if (!token) {
        setRedirectTo('/login');
        setStatus('denied');
        return;
      }

      try {
        const response = await authService.getMe();
        const user = response.data.data.user;

        if (user.role !== 'admin') {
          setRedirectTo('/');
          setStatus('denied');
          return;
        }

        setStatus('allowed');
      } catch (_error) {
        setRedirectTo('/login');
        setStatus('denied');
      }
    };

    verifyAdmin();
  }, [location.pathname]);

  if (status === 'checking') {
    return (
      <section className="page">
        <div className="status-card">Verifying admin access...</div>
      </section>
    );
  }

  if (status === 'denied') {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default AdminRoute;

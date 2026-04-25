import { Link, Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    window.localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar-shell">
        <div className="admin-sidebar-shell__brand">
          <Link to="/admin">Storefront Admin</Link>
          <button type="button" className="button-link button-link--secondary admin-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <AdminSidebar onLogout={handleLogout} />
      </aside>

      <section className="admin-content-shell">
        <Outlet />
      </section>
    </div>
  );
};

export default AdminLayout;

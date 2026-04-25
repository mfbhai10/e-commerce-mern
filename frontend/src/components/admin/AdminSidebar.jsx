import { NavLink } from 'react-router-dom';

const navClass = ({ isActive }) => `admin-nav-link${isActive ? ' admin-nav-link--active' : ''}`;

const AdminSidebar = () => {
  return (
    <nav className="admin-sidebar" aria-label="Admin navigation">
      <NavLink end to="/admin" className={navClass}>
        Dashboard
      </NavLink>
      <NavLink to="/admin/products" className={navClass}>
        Products
      </NavLink>
      <NavLink to="/admin/orders" className={navClass}>
        Orders
      </NavLink>
      <NavLink to="/admin/categories" className={navClass}>
        Categories
      </NavLink>
    </nav>
  );
};

export default AdminSidebar;

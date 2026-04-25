import { NavLink, Link } from "react-router-dom";

const navLinkClass = ({ isActive }) =>
  `nav-link${isActive ? " nav-link--active" : ""}`;

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          Storefront
        </Link>

        <nav className="navbar__nav" aria-label="Primary navigation">
          <NavLink to="/products" className={navLinkClass}>
            Products
          </NavLink>
          <NavLink to="/cart" className={navLinkClass}>
            Cart
          </NavLink>
          <NavLink to="/login" className={navLinkClass}>
            Login
          </NavLink>
          <NavLink to="/register" className={navLinkClass}>
            Register
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

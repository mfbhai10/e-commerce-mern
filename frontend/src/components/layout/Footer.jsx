const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p>
          © {new Date().getFullYear()} Storefront. Built with React, Router, and
          Axios.
        </p>
      </div>
    </footer>
  );
};

export default Footer;

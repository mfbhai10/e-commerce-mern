const defaultHighlights = [
  "Live product catalog from API",
  "Secure JWT-backed auth flow",
  "Responsive cart and checkout UI",
];

const AuthShell = ({
  title,
  description,
  children,
  highlights = defaultHighlights,
  footer,
}) => {
  return (
    <div className="auth-grid">
      <aside className="auth-panel">
        <p className="section-header__eyebrow">Storefront</p>
        <h1 className="auth-panel__title">{title}</h1>
        <p className="auth-panel__description">{description}</p>

        <ul className="auth-panel__list">
          {highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>

      <section className="auth-card">
        {children}
        {footer ? <div className="auth-card__footer">{footer}</div> : null}
      </section>
    </div>
  );
};

export default AuthShell;

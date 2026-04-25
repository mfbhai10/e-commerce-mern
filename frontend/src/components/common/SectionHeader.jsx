const SectionHeader = ({ eyebrow, title, description, action }) => {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <p className="section-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="section-header__title">{title}</h1>
        {description ? (
          <p className="section-header__description">{description}</p>
        ) : null}
      </div>
      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  );
};

export default SectionHeader;

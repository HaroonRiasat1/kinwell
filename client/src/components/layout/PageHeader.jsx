/** Title block at the top of a page, with optional actions on the right. */
export function PageHeader({ eyebrow, title, children, divider = true }) {
  return (
    <>
      <header className="kw-page-head">
        <div className="stack" style={{ '--gap': '6px' }}>
          {eyebrow && <div className="text-sm muted">{eyebrow}</div>}
          <h1>{title}</h1>
        </div>
        {children}
      </header>
      {divider && <div className="divider" />}
    </>
  );
}

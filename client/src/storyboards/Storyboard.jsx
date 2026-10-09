/**
 * A storyboard: numbered, scaled-down frames of real screens with a caption for
 * each step of a user journey. Frames render the actual components, not images.
 */
export function Storyboard({ title, persona, goal, frames, scale = 0.36, height = 340 }) {
  return (
    <div className="stack" style={{ '--gap': '24px', padding: 32 }}>
      <header className="stack" style={{ '--gap': '6px', maxWidth: 760 }}>
        <div className="kw-kicker kw-kicker--teal">Storyboard</div>
        <h1 style={{ fontSize: 34, fontWeight: 800 }}>{title}</h1>
        {persona && (
          <p>
            <strong>Who:</strong> {persona}
          </p>
        )}
        {goal && (
          <p className="muted">
            <strong>Goal:</strong> {goal}
          </p>
        )}
      </header>
      <ol className="kw-board">
        {frames.map((f, i) => (
          <li key={f.title} className="kw-frame">
            <div className="kw-frame__screen" style={{ '--scale': f.scale ?? scale, '--h': `${f.height ?? height}px` }} aria-hidden="true">
              <div className="kw-frame__scaler">{f.screen}</div>
            </div>
            <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
              <span className="kw-frame__num">{i + 1}</span>
              <div>
                <div className="strong">{f.title}</div>
                <div className="text-sm muted">{f.caption}</div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const TONES = {
  teal: { background: 'var(--kw-teal-100)', color: 'var(--kw-teal-800)' },
  deep: { background: 'var(--kw-teal-700)', color: '#fff' },
  sage: { background: '#c7ddd6', color: '#1f544b' },
  coral: { background: '#f6d3c4', color: '#7a3a22' },
};

/** Round avatar: a photo when `src` is given, otherwise the first initial. */
export function Avatar({ name = '', src, size = 44, tone = 'teal' }) {
  const style = { '--size': `${size}px`, ...TONES[tone] };
  if (src) return <img className="kw-avatar" src={src} alt="" style={style} />;
  return (
    <span className="kw-avatar" style={style} aria-hidden="true">
      {name.trim()[0]?.toUpperCase()}
    </span>
  );
}

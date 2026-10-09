/** Frosted glass surface — the base container for every block of content. */
export function Card({ as: Tag = 'section', variant, pad, gap, className = '', style, children, ...rest }) {
  const cls = ['kw-card', variant && `kw-card--${variant}`, className].filter(Boolean).join(' ');
  return (
    <Tag className={cls} style={{ ...(pad != null && { '--pad': typeof pad === 'number' ? `${pad}px` : pad }), ...(gap != null && { '--gap': `${gap}px` }), ...style }} {...rest}>
      {children}
    </Tag>
  );
}

/** Small uppercase label that names a section ("HEALTH AT A GLANCE"). */
export function Kicker({ as: Tag = 'div', tone, children, ...rest }) {
  return (
    <Tag className={`kw-kicker${tone ? ` kw-kicker--${tone}` : ''}`} {...rest}>
      {children}
    </Tag>
  );
}

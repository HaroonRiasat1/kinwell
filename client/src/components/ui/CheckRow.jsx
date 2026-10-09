import { Icon } from './Icon.jsx';

/** One line of today's plan — a supplement or meal the parent ticks off. */
export function CheckRow({ title, meta, done, onToggle }) {
  return (
    <button type="button" role="checkbox" aria-checked={done} className="kw-checkrow" onClick={onToggle}>
      <span className="kw-checkrow__box">{done && <Icon name="check" strokeWidth={3} />}</span>
      <span className="grow" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
        <span style={{ fontWeight: 700, fontSize: 17 }}>{title}</span>
        <span className="text-xs muted">{meta}</span>
      </span>
      <span className="kw-checkrow__state">{done ? 'Done' : 'To do'}</span>
    </button>
  );
}

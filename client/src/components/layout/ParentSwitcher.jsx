import { Avatar } from '../ui/index.js';

/** Lets the family flip between parents (e.g. Ammi and Abbu). */
export function ParentSwitcher({ parents, activeId, onSelect }) {
  return (
    <div role="tablist" aria-label="Choose parent" className="row" style={{ '--gap': '8px' }}>
      {parents.map((p) => (
        <button key={p.id} type="button" role="tab" aria-selected={p.id === activeId} className="kw-parent-switch" onClick={() => onSelect(p)}>
          <Avatar name={p.short} size={46} tone="sage" />
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: 18 }}>
              {p.short}, {p.age}
            </span>
            <span className="text-xs muted">{p.city}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

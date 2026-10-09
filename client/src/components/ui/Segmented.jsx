import { NavLink } from 'react-router-dom';

/**
 * Pill tab list. Give `items` as {value,label} with `value`/`onChange` for local state,
 * or as {to,label} to drive navigation.
 */
export function Segmented({ items, value, onChange, label, fill = false }) {
  return (
    <div role="tablist" aria-label={label} className={`kw-seg${fill ? ' kw-seg--fill' : ''}`}>
      {items.map((it) =>
        it.to ? (
          <NavLink key={it.to} to={it.to} end={it.end} role="tab" className="kw-seg__item">
            {it.label}
          </NavLink>
        ) : (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={value === it.value}
            className="kw-seg__item"
            onClick={() => onChange(it.value)}
          >
            {it.label}
          </button>
        ),
      )}
    </div>
  );
}

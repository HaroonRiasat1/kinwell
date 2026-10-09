/** Toggleable pill used for filters, day pickers and multi-select answers. */
export function Chip({ selected = false, children, className = '', ...rest }) {
  return (
    <button type="button" aria-pressed={selected} className={`kw-chip ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ChipGroup({ label, options, value, onChange, multiple = false }) {
  const isOn = (o) => (multiple ? value.includes(o) : value === o);
  const toggle = (o) => {
    if (!multiple) return onChange(o);
    onChange(isOn(o) ? value.filter((v) => v !== o) : [...value, o]);
  };
  return (
    <div role="group" aria-label={label} className="row" style={{ '--gap': '8px' }}>
      {options.map((o) => (
        <Chip key={o} selected={isOn(o)} onClick={() => toggle(o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

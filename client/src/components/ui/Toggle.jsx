/** On/off switch. Use for settings that take effect immediately (e.g. reminders). */
export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} className="kw-toggle" onClick={() => onChange(!checked)}>
      <span className="kw-toggle__knob" />
    </button>
  );
}

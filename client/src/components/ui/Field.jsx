import { useId } from 'react';

/** Labelled form control. Renders an input, select or textarea with hint and error text. */
export function Field({ label, hint, error, as = 'input', options, children, className = '', ...rest }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  const common = { id, className: 'kw-input', 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, ...rest };
  let control;
  if (as === 'select') {
    control = (
      <select {...common}>
        {options?.map((o) => {
          const { value, label: text } = typeof o === 'string' ? { value: o, label: o } : o;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    );
  } else if (as === 'textarea') {
    control = <textarea {...common} />;
  } else {
    control = children ? (
      <div className="kw-input-wrap">
        <input {...common} />
        {children}
      </div>
    ) : (
      <input {...common} />
    );
  }
  return (
    <div className={`kw-field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {control}
      {hint && (
        <span id={`${id}-hint`} className="kw-field__hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${id}-err`} className="kw-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function Checkbox({ label, ...rest }) {
  return (
    <label className="kw-check">
      <input type="checkbox" {...rest} />
      {label}
    </label>
  );
}

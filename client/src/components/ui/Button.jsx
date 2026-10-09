import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

/**
 * Capsule button. `primary` (teal) for trust actions, `cta` (coral) for the one
 * main action on a screen, `glass` for secondary, `link` for inline actions.
 * Pass `to` to render a router link styled as a button.
 */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon, iconRight, block, to, className = '', children, type = 'button', ...rest },
  ref,
) {
  const cls = ['kw-btn', `kw-btn--${variant}`, size !== 'md' && `kw-btn--${size}`, block && 'kw-btn--block', className]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      {icon && <Icon name={icon} />}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </>
  );
  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} className={cls} {...rest}>
      {content}
    </button>
  );
});

export function IconButton({ icon, label, variant = 'glass', size = 20, className = '', ...rest }) {
  return (
    <button type="button" aria-label={label} className={`kw-btn kw-btn--${variant} kw-btn--icon ${className}`} {...rest}>
      <Icon name={icon} size={size} />
    </button>
  );
}

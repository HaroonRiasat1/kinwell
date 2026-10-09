import { Icon } from './Icon.jsx';
import { STATUS } from '../../lib/status.js';

const ICON = { normal: 'checkCircle', watch: 'eye', attention: 'alert' };

/** Health status pill. Always pairs color with an icon and a word, never color alone. */
export function StatusTag({ status = 'normal', label, size = 'md' }) {
  return (
    <span className={`kw-tag kw-tag--${status}${size === 'lg' ? ' kw-tag--lg' : ''}`}>
      <Icon name={ICON[status]} size={size === 'lg' ? 16 : 14} strokeWidth={2.6} />
      {label ?? STATUS[status].label}
    </span>
  );
}

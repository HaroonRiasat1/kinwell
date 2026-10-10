import { Button } from './Button.jsx';
import { Card } from './Card.jsx';
import { Icon } from './Icon.jsx';

/** Friendly error block: says whose fault it is, that data is safe, and what to do next. */
export function ErrorState({ title, children, onRetry, secondary, retryLabel = 'Try again' }) {
  return (
    <Card role="alert" pad={32} style={{ maxWidth: 640 }}>
      <span className="kw-icon-tile kw-icon-tile--attention" style={{ '--size': '56px' }}>
        <Icon name="alert" size={28} />
      </span>
      <h2 style={{ fontSize: 26, fontWeight: 800 }}>{title}</h2>
      <p className="muted">{children}</p>
      <div className="row">
        {onRetry && (
          <Button size="lg" icon="refresh" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {secondary}
      </div>
    </Card>
  );
}

/** Empty state with a clear next step. */
export function EmptyState({ kicker, title, children, action }) {
  return (
    <Card pad={32} style={{ maxWidth: 760 }}>
      {kicker && <div className="kw-kicker kw-kicker--deep">{kicker}</div>}
      <h2 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>{title}</h2>
      <p style={{ color: 'var(--kw-ink-2)' }}>{children}</p>
      {action}
    </Card>
  );
}

import { Button, Card, Icon } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { workspaceApi } from '../../api/endpoints.js';

/** Unread notices from admins (reminders, new clients), shown at the top of the Clients page. */
export function NoticesView({ notices, onRead }) {
  const unread = notices.filter((n) => !n.read);
  if (!unread.length) return null;
  return (
    <Card pad={18} gap={10} role="region" aria-label="Notices from Kinwell" style={{ background: 'rgba(253,245,227,0.9)' }}>
      {unread.map((n) => (
        <div key={n.id} className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
          <span className="kw-icon-tile" style={{ '--size': '40px', background: 'var(--kw-watch-bg)', color: 'var(--kw-watch)' }}>
            <Icon name="bell" />
          </span>
          <div className="grow">
            <div className="strong">{n.title}</div>
            {n.body && <div className="text-sm">{n.body}</div>}
            <div className="muted" style={{ fontSize: 13 }}>From {n.from}</div>
          </div>
          <Button variant="glass" size="sm" onClick={() => onRead(n)}>
            Got it
          </Button>
        </div>
      ))}
    </Card>
  );
}

export function Notices() {
  const { data, setData } = useApi(() => workspaceApi.notifications(), []);
  if (!data) return null;
  return <NoticesView notices={data} onRead={async (n) => setData(await workspaceApi.readNotification(n.id))} />;
}

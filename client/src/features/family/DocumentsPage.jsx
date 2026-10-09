import { Button, Card, EmptyState, Icon, SkeletonCard } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { useProfile } from './ProfileLayout.jsx';

export function DocumentsView({ parent, docs }) {
  return (
    <Card pad={22} gap={6}>
      <div className="row row--between" style={{ marginBottom: 8 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>{parent.short}'s documents</h2>
        <Button variant="cta" icon="upload">
          Add a document
        </Button>
      </div>
      {docs.length === 0 && <p className="muted">Lab reports, prescriptions and scans you add will be kept here.</p>}
      {docs.map((d) => (
        <div key={d.id ?? d.name} className="row" style={{ '--gap': '14px', padding: '12px 0', borderTop: '1px solid var(--kw-rule-soft)' }}>
          <span className="kw-icon-tile" style={{ '--size': '44px', borderRadius: 14, background: 'rgba(255,255,255,0.8)' }}>
            <Icon name="file" size={20} />
          </span>
          <div className="grow" style={{ minWidth: 200, lineHeight: 1.35 }}>
            <div className="strong">{d.name}</div>
            <div className="muted" style={{ fontSize: 15 }}>
              {d.type} · {d.file} · Added by {d.by}
            </div>
          </div>
          <Button variant="glass" size="sm">
            View
          </Button>
        </div>
      ))}
    </Card>
  );
}

export default function DocumentsPage() {
  const { parent } = useProfile();
  const { data, error, reload } = useApi(() => parentApi.documents(parent.id), [parent.id]);
  if (error) return <EmptyState title="We couldn't load documents" action={<Button onClick={reload}>Try again</Button>} />;
  if (!data) return <SkeletonCard />;
  return <DocumentsView parent={parent} docs={data} />;
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, EmptyState, Kicker, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { useFamilyParent } from './FamilyLayout.jsx';

const TONE = { hina: 'sage', sana: 'deep', bilal: 'coral' };

function VisitCard({ visit, onOpen }) {
  return (
    <Card pad={16} gap={10} style={{ maxWidth: 520 }}>
      <Kicker tone="teal">Visit summary · {visit.short}</Kicker>
      <div className="strong" style={{ fontSize: 19 }}>
        {visit.title}
      </div>
      <div className="text-sm muted">{visit.summary}</div>
      <div className="stack" style={{ '--gap': '6px' }}>
        {visit.meas.map((m) => (
          <div key={m.n} className="row row--between text-sm">
            <span>{m.n}</span>
            <span className="row" style={{ '--gap': '8px' }}>
              <strong>{m.v}</strong>
              <StatusTag status={m.status} />
            </span>
          </div>
        ))}
      </div>
      <Button variant="glass" size="sm" style={{ alignSelf: 'flex-start' }} onClick={onOpen}>
        Read the full summary
      </Button>
    </Card>
  );
}

export function MessagesView({ threads, activeParentId, onThread, thread, draft, onDraft, onSend, sending, onOpenVisit }) {
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: 'end' });
  }, [thread.length]);
  return (
    <div className="split" style={{ '--a': '300px', '--b': '1fr' }}>
      <Card pad={14} gap={6}>
        <h2 style={{ fontSize: 20, fontWeight: 800, padding: '4px 8px' }}>Conversations</h2>
        {threads.map((t) => (
          <button
            key={t.parentId}
            type="button"
            aria-current={t.parentId === activeParentId}
            onClick={() => onThread(t.parentId)}
            className="kw-timeline__item"
            style={{ gridTemplateColumns: '1fr' }}
          >
            <span className="row row--between">
              <span className="strong">{t.name}</span>
              <span className="muted" style={{ fontSize: 13 }}>
                {t.time}
              </span>
            </span>
            <span className="muted" style={{ fontSize: 15, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {t.last}
            </span>
          </button>
        ))}
      </Card>
      <Card pad={0} gap={0}>
        <div className="kw-thread" aria-live="polite">
          {thread.map((m) =>
            m.visit ? (
              <VisitCard key={m.id} visit={m.visit} onOpen={() => onOpenVisit(m.visit.id)} />
            ) : (
              <div key={m.id} className={`kw-bubble${m.mine ? ' kw-bubble--mine' : ''}`}>
                <Avatar name={m.fromName} size={36} tone={TONE[m.fromKey] ?? 'teal'} />
                <div>
                  <div className="kw-bubble__body">{m.text}</div>
                  <div className="kw-bubble__meta">
                    {m.mine ? 'You' : `${m.fromName} · ${m.fromRole}`} · {m.timeLabel}
                  </div>
                </div>
              </div>
            ),
          )}
          <div ref={end} />
        </div>
        <form
          className="row"
          style={{ padding: 16, borderTop: '1px solid var(--kw-rule)', flexWrap: 'nowrap' }}
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <label htmlFor="msg" className="sr-only">
            Write a message
          </label>
          <input id="msg" className="kw-input grow" placeholder="Write a message…" value={draft} onChange={(e) => onDraft(e.target.value)} />
          <Button type="submit" icon="message" disabled={!draft.trim() || sending}>
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function MessagesPage() {
  const { parent } = useFamilyParent();
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const threads = useApi(() => parentApi.threads(), []);
  const msgs = useApi(() => parentApi.messages(parent.id), [parent.id]);

  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const m = await parentApi.sendMessage(parent.id, text);
      msgs.setData((list) => [...list, m]);
      setDraft('');
      threads.reload();
    } finally {
      setSending(false);
    }
  };

  if (msgs.error) return <EmptyState title="We couldn't load messages" action={<Button onClick={msgs.reload}>Try again</Button>} />;
  if (!msgs.data || !threads.data) return <SkeletonCard minHeight={420} />;
  return (
    <MessagesView
      threads={threads.data}
      activeParentId={parent.id}
      onThread={(id) => navigate(`/family/${id}/messages`)}
      thread={msgs.data}
      draft={draft}
      onDraft={setDraft}
      onSend={send}
      sending={sending}
      onOpenVisit={() => navigate(`/family/${parent.id}/visits`)}
    />
  );
}

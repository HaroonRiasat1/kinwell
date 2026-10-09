import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, Button, Card, Field, Icon, Kicker } from '../../components/ui/index.js';
import { workspaceApi } from '../../api/endpoints.js';
import { useOptionalAuth } from '../../context/AuthContext.jsx';
import { useWorkspace } from './WorkspaceLayout.jsx';

/** Write a plain-language note; preview it exactly as the family will see it. */
export function SendUpdateView({ author, text, onText, onSend, sending, sent, onAnother }) {
  if (sent) {
    return (
      <Card pad={32} style={{ maxWidth: 640 }}>
        <span className="kw-icon-tile" style={{ background: 'var(--kw-normal-bg)', color: 'var(--kw-normal)' }}>
          <Icon name="checkCircle" size={26} />
        </span>
        <h2 style={{ fontSize: 28, fontWeight: 800 }}>Update sent</h2>
        <p className="muted">The family will see it in their messages and get a notification.</p>
        <Button variant="glass" onClick={onAnother} style={{ alignSelf: 'flex-start' }}>
          Write another
        </Button>
      </Card>
    );
  }
  return (
    <div className="split" style={{ '--a': '1fr', '--b': '1fr' }}>
      <Card pad={24}>
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Your note</h2>
        <Field as="textarea" label="Write it the way you'd say it to them" value={text} onChange={(e) => onText(e.target.value)} hint="Avoid medical jargon. Say what changed, why, and what they can do." style={{ minHeight: 220 }} />
        <Button variant="cta" size="lg" icon="message" onClick={onSend} disabled={!text.trim() || sending} style={{ alignSelf: 'flex-start' }}>
          {sending ? 'Sending…' : 'Send update'}
        </Button>
      </Card>
      <Card pad={24}>
        <Kicker>Preview · what the family sees</Kicker>
        <div className="kw-bubble">
          <Avatar name={author} size={36} tone="sage" />
          <div>
            <div className="kw-bubble__body" style={{ whiteSpace: 'pre-wrap' }}>
              {text || '…'}
            </div>
            <div className="kw-bubble__meta">{author} · Nutritionist · Just now</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SendUpdatePage() {
  const { parentId } = useParams();
  const auth = useOptionalAuth();
  const { setHeader, setCurrentId, clients } = useWorkspace();
  const client = clients.data?.find((c) => c.id === parentId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => setCurrentId(parentId), [parentId, setCurrentId]);
  useEffect(() => {
    setHeader({ title: 'Send update to the family', sub: client ? `About ${client.name} · goes to ${client.family}` : '' });
  }, [client, setHeader]);

  const send = async () => {
    setSending(true);
    try {
      await workspaceApi.sendUpdate(parentId, text.trim());
      setSent(true);
      setText('');
    } finally {
      setSending(false);
    }
  };
  return <SendUpdateView author={auth?.user?.name ?? 'Nutritionist'} text={text} onText={setText} onSend={send} sending={sending} sent={sent} onAnother={() => setSent(false)} />;
}

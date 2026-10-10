import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Button, EmptyState, SkeletonCard } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { parentApi } from '../../api/endpoints.js';
import { MessagesView } from '../family/MessagesPage.jsx';
import { useHeader, useWorkspace } from './WorkspaceLayout.jsx';

/** Hina's inbox: a conversation per client; ones waiting for her reply come first. */
export default function WorkspaceMessagesPage() {
  const { parentId } = useParams();
  const navigate = useNavigate();
  const { inbox } = useWorkspace();
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const thread = useApi(() => (parentId ? parentApi.messages(parentId) : Promise.resolve([])), [parentId]);
  const waiting = inbox.data?.needsReply ?? 0;
  useHeader('Messages', waiting ? `${waiting} ${waiting === 1 ? 'family is' : 'families are'} waiting for a reply` : 'Conversations with your clients’ families', null, [waiting]);
  useEffect(() => setDraft(''), [parentId]);

  if (inbox.error) return <EmptyState title="We couldn't load your messages" action={<Button onClick={inbox.reload}>Try again</Button>} />;
  if (!inbox.data) return <SkeletonCard minHeight={420} />;
  if (!parentId && inbox.data.threads[0]) return <Navigate to={`/workspace/messages/${inbox.data.threads[0].parentId}`} replace />;
  if (!inbox.data.threads.length) return <EmptyState title="No conversations yet">Families' messages to you will appear here.</EmptyState>;

  const threads = inbox.data.threads.map((t) => ({ ...t, name: `${t.needsReply ? '● ' : ''}${t.name}` }));
  const send = async () => {
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const m = await parentApi.sendMessage(parentId, text);
      thread.setData((list) => [...list, m]);
      setDraft('');
      inbox.reload();
    } finally {
      setSending(false);
    }
  };
  if (!thread.data) return <SkeletonCard minHeight={420} />;
  return (
    <MessagesView
      threads={threads}
      activeParentId={parentId}
      onThread={(id) => navigate(`/workspace/messages/${id}`)}
      thread={thread.data}
      draft={draft}
      onDraft={setDraft}
      onSend={send}
      sending={sending}
      onOpenVisit={() => navigate(`/workspace/clients/${parentId}`)}
    />
  );
}

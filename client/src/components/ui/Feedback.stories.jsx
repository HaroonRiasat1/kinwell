import { useState } from 'react';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { CheckRow } from './CheckRow.jsx';
import { Modal } from './Modal.jsx';
import { Skeleton, SkeletonCard } from './Skeleton.jsx';
import { EmptyState, ErrorState } from './StateViews.jsx';

export default { title: 'Components/Feedback & misc', tags: ['autodocs'] };

export const Checklist = {
  render: () => {
    const [done, setDone] = useState({ a: true, b: false });
    return (
      <ul style={{ maxWidth: 420 }}>
        <li>
          <CheckRow title="Vitamin D3 · 2,000 IU" meta="Supplement · Morning, with breakfast" done={done.a} onToggle={() => setDone({ ...done, a: !done.a })} />
        </li>
        <li>
          <CheckRow title="Calcium · 500 mg" meta="Supplement · Afternoon, with lunch" done={done.b} onToggle={() => setDone({ ...done, b: !done.b })} />
        </li>
      </ul>
    );
  },
};
export const Avatars = {
  render: () => (
    <div className="row">
      <Avatar name="Hina" tone="sage" size={52} />
      <Avatar name="Sana" tone="deep" />
      <Avatar name="Bilal" tone="coral" />
      <Avatar name="Khalid" />
    </div>
  ),
};
export const Loading = {
  render: () => (
    <div className="grid-auto" style={{ maxWidth: 900 }}>
      <SkeletonCard />
      <div className="stack">
        <Skeleton width="40%" />
        <Skeleton height={26} block />
      </div>
    </div>
  ),
};
export const Error = {
  render: () => (
    <ErrorState title="We couldn't load Ammi's latest updates" onRetry={() => {}} secondary={<Button variant="glass" size="lg">Message Hina instead</Button>}>
      This is on our side, not yours. Ammi's records are safe.
    </ErrorState>
  ),
};
export const Empty = {
  render: () => (
    <EmptyState kicker="No lab reports yet" title="Add Ammi's first lab report" action={<Button variant="cta" icon="upload">Choose file</Button>}>
      Once there's a report, you'll see each result here.
    </EmptyState>
  ),
};
export const Dialog = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Modal open={open} onClose={() => setOpen(false)} labelledBy="d-h">
          <h2 id="d-h">Reschedule Ammi's visit</h2>
          <p>Escape or a click outside closes it.</p>
          <Button onClick={() => setOpen(false)}>Done</Button>
        </Modal>
      </>
    );
  },
};

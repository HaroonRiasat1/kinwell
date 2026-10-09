import { Card } from './Card.jsx';

export function Skeleton({ width = '100%', height = 14, soft, block, style }) {
  return (
    <div
      aria-hidden="true"
      className={`kw-skel${soft ? ' kw-skel--soft' : ''}${block ? ' kw-skel--block' : ''}`}
      style={{ width, height, ...style }}
    />
  );
}

/** Placeholder card shown while a section loads. */
export function SkeletonCard({ minHeight = 260 }) {
  return (
    <Card style={{ minHeight }} gap={14}>
      <Skeleton width="40%" />
      <Skeleton width="75%" height={26} block />
      <Skeleton soft />
      <Skeleton width="90%" soft />
      <div style={{ flex: 1 }} />
      <Skeleton width="60%" height={44} block />
    </Card>
  );
}

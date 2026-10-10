import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/layout/index.js';
import { Button, Card, EmptyState, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';
import { FilterSelect, Pager, RowLink, SearchBox } from './kit.jsx';

const COLS = 'minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr)';

export function FamiliesView({ data, team, filters, setFilter }) {
  return (
    <div className="stack" style={{ '--gap': '16px' }}>
      <div className="row">
        <SearchBox label="Search families" placeholder="Family, parent or contact" value={filters.q} onChange={(q) => setFilter({ q })} />
        <FilterSelect label="Status" value={filters.status} onChange={(status) => setFilter({ status })} options={[['', 'All'], ['attention', 'Needs attention'], ['watch', 'Watch'], ['normal', 'Normal']]} />
        <FilterSelect label="Nutritionist" value={filters.nutritionist} onChange={(nutritionist) => setFilter({ nutritionist })} options={[['', 'Everyone'], ...team.map((t) => [t.id, t.name])]} />
      </div>
      <Card variant="flush">
        <div className="kw-table-scroll" style={{ '--min': '820px' }}>
          <div role="table" aria-label="Families" style={{ '--cols': COLS }}>
            <div role="row" className="kw-table__head">
              {['Family', 'Main contact', 'Parents', 'Nutritionist', 'Status', 'Last activity'].map((h) => (
                <span key={h} role="columnheader">
                  {h}
                </span>
              ))}
            </div>
            {data.items.map((r) => (
              <RowLink key={r.id} to={`/admin/families/${r.id}`}>
                <span role="cell" className="strong">
                  {r.family}
                </span>
                <span role="cell" style={{ fontSize: 15 }}>
                  {r.contact}
                </span>
                <span role="cell" style={{ fontSize: 15 }}>
                  {r.parents}
                </span>
                <span role="cell" style={{ fontSize: 15 }}>
                  {r.nutritionist}
                </span>
                <span role="cell">
                  <StatusTag status={r.status} />
                </span>
                <span role="cell" className="muted" style={{ fontSize: 15 }}>
                  {r.last}
                </span>
              </RowLink>
            ))}
          </div>
        </div>
        {data.items.length === 0 && <p className="muted" style={{ padding: 20 }}>No families match.</p>}
        <Pager page={data.page} pages={data.pages} total={data.total} noun="families" onPage={(page) => setFilter({ page: String(page) }, false)} />
      </Card>
    </div>
  );
}

export default function FamiliesPage() {
  // Filters live in the URL so a filtered list can be shared or bookmarked.
  const [params, setParams] = useSearchParams();
  const filters = { q: params.get('q') ?? '', status: params.get('status') ?? '', nutritionist: params.get('nutritionist') ?? '', page: Number(params.get('page') ?? 1) };
  const setFilter = useCallback(
    (patch, resetPage = true) =>
      setParams((p) => {
        const next = new URLSearchParams(p);
        Object.entries({ ...patch, ...(resetPage && { page: '' }) }).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      }),
    [setParams],
  );
  const list = useApi(() => adminApi.families(filters), [filters.q, filters.status, filters.nutritionist, filters.page]);
  const team = useApi(() => adminApi.team(), []);
  return (
    <>
      <PageHeader eyebrow="All of Lahore" title="Families" divider={false} />
      {list.error && <EmptyState title="We couldn't load families" action={<Button onClick={list.reload}>Try again</Button>} />}
      {!list.data && !list.error && <SkeletonCard />}
      {list.data && <FamiliesView data={list.data} team={team.data ?? []} filters={filters} setFilter={setFilter} />}
    </>
  );
}

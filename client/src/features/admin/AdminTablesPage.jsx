import { PageHeader } from '../../components/layout/index.js';
import { Avatar, Button, Card, EmptyState, SkeletonCard, StatusTag } from '../../components/ui/index.js';
import { useApi } from '../../hooks/useApi.js';
import { adminApi } from '../../api/endpoints.js';

/** Generic admin list rendered as a scrollable grid table. */
export function AdminTable({ label, columns, rows, cols }) {
  return (
    <Card variant="flush">
      <div className="kw-table-scroll" style={{ '--min': '820px' }}>
        <div role="table" aria-label={label} style={{ '--cols': cols }}>
          <div role="row" className="kw-table__head">
            {columns.map((c) => (
              <span key={c.key} role="columnheader">
                {c.label}
              </span>
            ))}
          </div>
          {rows.map((r) => (
            <div key={r.id} role="row" className="kw-table__row" style={{ fontSize: 16 }}>
              {columns.map((c) => (
                <span key={c.key} role="cell">
                  {c.render ? c.render(r) : r[c.key]}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

const person = (name, sub) => (
  <span className="row" style={{ '--gap': '10px', flexWrap: 'nowrap' }}>
    <Avatar name={name} size={36} />
    <span>
      <span className="strong" style={{ display: 'block' }}>
        {name}
      </span>
      {sub && <span className="muted" style={{ fontSize: 14 }}>{sub}</span>}
    </span>
  </span>
);

export const TEAM_COLUMNS = [
  { key: 'name', label: 'Nutritionist', render: (r) => person(r.name) },
  { key: 'area', label: 'Areas' },
  { key: 'clients', label: 'Clients' },
  { key: 'week', label: 'Visits this week' },
  { key: 'onTime', label: 'Notes on time' },
  { key: 'status', label: 'Status', render: (r) => <StatusTag status={r.status} label={r.label} /> },
];
export const FAMILY_COLUMNS = [
  { key: 'family', label: 'Family', render: (r) => <span className="strong">{r.family}</span> },
  { key: 'contact', label: 'Main contact' },
  { key: 'parents', label: 'Parents' },
  { key: 'nutritionist', label: 'Nutritionist' },
  { key: 'status', label: 'Status', render: (r) => <StatusTag status={r.status} /> },
  { key: 'last', label: 'Last activity' },
];

function AdminListPage({ title, load, columns, cols }) {
  const { data, error, reload } = useApi(load, []);
  return (
    <>
      <PageHeader eyebrow="All of Lahore" title={title} divider={false} />
      {error && <EmptyState title={`We couldn't load ${title.toLowerCase()}`} action={<Button onClick={reload}>Try again</Button>} />}
      {!data && !error && <SkeletonCard />}
      {data && <AdminTable label={title} columns={columns} rows={data} cols={cols} />}
    </>
  );
}

export function NutritionistsPage() {
  return <AdminListPage title="Nutritionists" load={adminApi.team} columns={TEAM_COLUMNS} cols="minmax(0,1.5fr) minmax(0,1.3fr) minmax(0,0.6fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,1.3fr)" />;
}

export function FamiliesPage() {
  return <AdminListPage title="Families" load={adminApi.families} columns={FAMILY_COLUMNS} cols="minmax(0,1.3fr) minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,0.8fr)" />;
}
